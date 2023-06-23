// TODO source from sdk
// @ts-check
/// <reference types="ses"/>

import {
  ValueFollower,
  iterateLatest,
  makeFollower,
  makeLeader,
} from '@agoric/casting';
import { makeImportContext } from './makeImportContext';
import { archivingAlternative, networkConfigUrl, rpcUrl } from 'config';
import { makeAgoricChainStorageWatcher } from '@agoric/rpc';
import { sample } from 'lodash-es';

/**
 * @typedef {{boardId: string, iface: string}} RpcRemote
 */

export const marshal = makeImportContext().fromBoard;

type MinimalNetworkConfig = { rpcAddrs: string[]; chainName: string };

const fromAgoricNet = (str: string): Promise<MinimalNetworkConfig> => {
  const [netName, chainName] = str.split(',');
  if (chainName) {
    return Promise.resolve({ chainName, rpcAddrs: [rpcUrl(netName)] });
  }
  return fetch(networkConfigUrl(netName)).then(res => res.json());
};

// XXX hard coded default to local
let networkConfig: MinimalNetworkConfig = {
  rpcAddrs: ['http://localhost:26657'],
  chainName: 'agoric',
};

const makeAgoricNames = async (
  follow: (path: string) => Promise<ValueFollower<unknown>>,
) => {
  const entries = await Promise.all(
    ['brand', 'instance'].map(async kind => {
      const f = follow(`:published.agoricNames.${kind}`);
      for await (const { value } of iterateLatest<any>(f)) {
        return [kind, Object.fromEntries(value)];
      }
    }),
  );
  return Object.fromEntries(entries);
};

// Until casting supports querying keys https://github.com/Agoric/agoric-sdk/issues/6690
const fetchVstorageKeys = async (
  rpcAddr: string,
  path: string,
  height?: number,
) => {
  const options = {
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'abci_query',
      params: {
        path: '/custom/vstorage/children/' + path,
        height: height && height.toString(),
      }, // height must be a string (bigint)
    }),
  };

  const res = await fetch(rpcAddr, options);
  const d = await res.json();
  return (
    d.result.response.value &&
    JSON.parse(atob(d.result.response.value)).children
  );
};

export const makeRpcUtils = async ({ agoricNet }) => {
  networkConfig =
    agoricNet === 'local'
      ? { rpcAddrs: ['http://localhost:26657'], chainName: 'agoric' }
      : await fromAgoricNet(agoricNet);

  const { rpcAddrs } = networkConfig;

  const leader = makeLeader(
    archivingAlternative(networkConfig.rpcAddrs[0]),
    {},
  );

  // XXX memoize on path
  const follow = (path: string) =>
    makeFollower(path, leader, { unserializer: marshal, proof: 'none' });

  const agoricNames = await makeAgoricNames(follow);
  const vstorage = {
    keys: (path: string, blockHeight?: number) =>
      fetchVstorageKeys(sample(rpcAddrs), path, blockHeight),
  };

  const storageWatcher = makeAgoricChainStorageWatcher(
    sample(rpcAddrs),
    networkConfig.chainName,
    marshal.unserialize,
  );

  return {
    agoricNames,
    follow,
    leader,
    vstorage,
    storageWatcher,
  };
};
export type RpcUtils = Awaited<ReturnType<typeof makeRpcUtils>>;
