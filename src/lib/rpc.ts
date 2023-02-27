// TODO source from sdk
// @ts-check
/// <reference types="ses"/>

import { makeFollower, makeLeader } from '@agoric/casting';

/**
 * @typedef {{boardId: string, iface: string}} RpcRemote
 */

export const networkConfigUrl = (agoricNetName: string) => {
  if (agoricNetName === 'local') {
    return 'https://wallet.agoric.app/wallet/network-config';
  } else {
    return `https://${agoricNetName}.agoric.net/network-config`;
  }
};
export const rpcUrl = agoricNetSubdomain =>
  `https://${agoricNetSubdomain}.rpc.agoric.net:443`;

type MinimalNetworkConfig = { rpcAddrs: string[]; chainName: string };

const fromAgoricNet = (str: string): Promise<MinimalNetworkConfig> => {
  const [netName, chainName] = str.split(',');
  if (chainName) {
    return Promise.resolve({ chainName, rpcAddrs: [rpcUrl(netName)] });
  }
  return fetch(networkConfigUrl(netName)).then(res => res.json());
};

// XXX hard coded default to local
export let networkConfig: MinimalNetworkConfig = {
  rpcAddrs: ['http://localhost:26657'],
  chainName: 'agoric',
};

export const makeVStorage = () => {
  const getJSON = path => {
    const url = networkConfig.rpcAddrs[0] + path;
    console.warn('fetching', url);
    return fetch(url).then(res => res.json());
  };

  return {
    // height=0 is the same as omitting height and implies the highest block
    url: (path = 'published', { kind = 'children', height = 0 } = {}) =>
      `/abci_query?path=%22/custom/vstorage/${kind}/${path}%22&height=${height}`,
    decode({ result: { response } }) {
      const { code } = response;
      if (code !== 0) {
        throw response;
      }
      const { value } = response;
      return atob(value);
    },
    /**
     *
     * @param {string} path
     * @returns {Promise<unknown>} latest vstorage value at path
     */
    async read(path = 'published') {
      const raw = await getJSON(this.url(path, { kind: 'data' }));
      return this.decode(raw);
    },
    async keys(path = 'published') {
      const raw = await getJSON(this.url(path, { kind: 'children' }));
      return JSON.parse(this.decode(raw)).children;
    },
    /**
     * @param {string} path
     * @param {number} [height] default is highest
     * @returns {Promise<{blockHeight: number, values: string[]}>}
     */
    async readAt(path, height = undefined) {
      const raw = await getJSON(this.url(path, { kind: 'data', height }));
      const txt = this.decode(raw);
      /** @type {{ value: string }} */
      const { value } = JSON.parse(txt);
      return JSON.parse(value);
    },
    async readAll(path) {
      const parts = [];
      // undefined the first iteration, to query at the highest
      let blockHeight;
      do {
        let values;
        try {
          // eslint-disable-next-line no-await-in-loop
          ({ blockHeight, values } = await this.readAt(
            path,
            blockHeight && blockHeight - 1,
          ));
        } catch (err) {
          if ('log' in err && err.log.match(/unknown request/)) {
            break;
          }
          throw err;
        }
        parts.push(values);
      } while (blockHeight > 0);
      return parts.flat();
    },
  };
};
/** @typedef {ReturnType<typeof makeVStorage>} VStorage */

/**
 * Like makeMarshal but,
 * - slotToVal takes an iface arg
 * - if a part being serialized has a boardId property, it passes through as a slot value whereas the normal marshaller would treat it as a copyRecord
 *
 * @param {(slot: string, iface: string) => any} slotToVal
 * @returns {Marshaller}
 */
export const boardSlottingMarshaller = (slotToVal = (s, _i) => s) => ({
  /** @param {{body: string, slots: string[]}} capData */
  unserialize: ({ body, slots }) => {
    const reviver = (_key, obj) => {
      const qclass = obj !== null && typeof obj === 'object' && obj['@qclass'];
      // NOTE: hilbert hotel not impl
      switch (qclass) {
        case 'slot': {
          const { index, iface } = obj;
          return slotToVal(slots[index], iface);
        }
        case 'bigint':
          return BigInt(obj.digits);
        case 'undefined':
          return undefined;
        default:
          return obj;
      }
    };
    return JSON.parse(body, reviver);
  },
  serialize: whole => {
    const seen = new Map();
    const slotIndex = v => {
      if (seen.has(v)) {
        return seen.get(v);
      }
      const index = seen.size;
      seen.set(v, index);
      return index;
    };

    const recur = part => {
      if (part === null) return null;
      if (typeof part === 'bigint') {
        return { '@qclass': 'bigint', digits: `${part}` };
      }
      if (Array.isArray(part)) {
        return part.map(recur);
      }
      if (typeof part === 'object') {
        if ('boardId' in part) {
          const { boardId, iface } = part;
          assert(iface, 'missing iface');
          const index = slotIndex(boardId);
          return { '@qclass': 'slot', index, iface };
        }
        return Object.fromEntries(
          Object.entries(part).map(([k, v]) => [k, recur(v)]),
        );
      }
      return part;
    };
    const after = recur(whole);
    return { body: JSON.stringify(after), slots: [...seen.keys()] };
  },
});

export const makeFromBoard = (slotKey = 'boardId') => {
  const cache = new Map();
  const convertSlotToVal = (slot, iface) => {
    if (cache.has(slot)) {
      return cache.get(slot);
    }
    const val = harden({ [slotKey]: slot, iface });
    cache.set(slot, val);
    return val;
  };
  return harden({ convertSlotToVal });
};
/** @typedef {ReturnType<typeof makeFromBoard>} IdMap */

export const storageHelper = {
  /** @param { string } txt */
  parseCapData: txt => {
    assert(typeof txt === 'string', typeof txt);
    /** @type {{ value: string }} */
    const { value } = JSON.parse(txt);
    const specimen = JSON.parse(value);
    const { blockHeight, values } = specimen;
    assert(values, `empty values in specimen ${value}`);
    const capDatas = storageHelper.parseMany(values);
    return { blockHeight, capDatas };
  },
  unserialize: (txt, ctx) => {
    const { capDatas } = storageHelper.parseCapData(txt);
    return capDatas.map(capData =>
      boardSlottingMarshaller(ctx.convertSlotToVal).unserialize(capData),
    );
  },
  /** @param {string[]} capDataStrings array of stringified capData */
  parseMany: capDataStrings => {
    assert(capDataStrings && capDataStrings.length);
    /** @type {{ body: string, slots: string[] }[]} */
    const capDatas = capDataStrings.map(s => JSON.parse(s));
    for (const capData of capDatas) {
      assert(typeof capData === 'object' && capData !== null);
      assert('body' in capData && 'slots' in capData);
      assert(typeof capData.body === 'string');
      assert(Array.isArray(capData.slots));
    }
    return capDatas;
  },
};
harden(storageHelper);

/**
 * @param {IdMap} ctx
 * @param {VStorage} vstorage
 * @returns {Promise<{brand: Record<string, RpcRemote>, instance: Record<string, RpcRemote>}>}
 */
export const makeAgoricNames = async (ctx, vstorage) => {
  const entries = await Promise.all(
    ['brand', 'instance'].map(async kind => {
      const content = await vstorage.read(`published.agoricNames.${kind}`);
      const parts = storageHelper.unserialize(content, ctx).at(-1);

      return [kind, Object.fromEntries(parts)];
    }),
  );
  return Object.fromEntries(entries);
};

export const makeRpcUtils = async ({ agoricNet }) => {
  networkConfig =
    agoricNet === 'local'
      ? { rpcAddrs: ['http://localhost:26657'], chainName: 'agoric' }
      : await fromAgoricNet(agoricNet);

  const vstorage = makeVStorage();
  const fromBoard = makeFromBoard();
  const agoricNames = await makeAgoricNames(fromBoard, vstorage);
  const leader = makeLeader(networkConfig.rpcAddrs[0]);

  const unserializer = boardSlottingMarshaller(fromBoard.convertSlotToVal);

  // XXX memoize on path
  const follow = (path: string) =>
    makeFollower(path, leader, {
      unserializer,
    });

  return {
    agoricNames,
    follow,
    leader,
    fromBoard,
    vstorage,
  };
};
export type RpcUtils = Awaited<ReturnType<typeof makeRpcUtils>>;
