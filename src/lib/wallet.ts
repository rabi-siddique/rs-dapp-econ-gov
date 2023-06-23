import type {
  Amount,
  Brand,
  DisplayInfo,
  Issuer,
} from '@agoric/ertp/src/types';
import { Position } from '@agoric/governance/src/types.js';
import { Ratio } from '@agoric/zoe/src/contractSupport';
import { SigningStargateClient as AmbientClient } from '@cosmjs/stargate';
import { ERef } from '@endo/eventual-send';
import { ChainInfo, Keplr } from '@keplr-wallet/types';
import React, { useContext, useEffect, useState } from 'react';
import {
  notifyError,
  notifySigning,
  notifySuccess,
} from 'utils/displayFunctions.js';
import { suggestChain } from './chainInfo.js';
import { makeInteractiveSigner } from './keyManagement.js';
import { marshal, RpcUtils } from './rpc';
import { makeRpcUtils } from './rpc.js';
import { accountInfoUrl, networkConfigUrl } from 'config.js';
import { AgoricChainStoragePathKind } from '@agoric/rpc/index.js';

export type RelativeTime = { timerBrand: Brand; relValue: bigint };

export const charterInvitationSpec = {
  instanceName: 'econCommitteeCharter',
  description: 'charter member invitation',
};

const absoluteDeadline = (relativeDeadlineMin: number) =>
  BigInt(relativeDeadlineMin * 60 + Math.round(Date.now() / 1000));

export const makeWalletUtils = async (rpcUtils: RpcUtils, keplr: Keplr) => {
  const { agoricNames } = rpcUtils;

  const lookupAgoricInstance = name => {
    const instance = agoricNames.instance[name];
    assert(instance, `no instance ${name} found`);
    return instance;
  };

  const makeChainKit = async () => {
    const chainInfo: ChainInfo = await suggestChain(
      networkConfigUrl(agoricNet),
      {
        fetch: window.fetch,
        keplr,
      },
    );

    const signer = await makeInteractiveSigner(
      chainInfo,
      keplr,
      AmbientClient.connectWithSigner,
    );

    return {
      chainInfo,
      signer,
    };
  };

  const chainKit = await makeChainKit();

  const walletKey = await keplr.getKey(chainKit.chainInfo.chainId);

  const makeOfferId = () => {
    return `econgov-${Date.now()}`;
  };

  return {
    agoricNet,
    chainKit,
    rpcUtils,
    getAddressExplorerHref() {
      return accountInfoUrl(agoricNet, walletKey.bech32Address);
    },
    getWalletAddress() {
      return walletKey.bech32Address;
    },
    makeOfferToAcceptInvitation(
      sourceContractName: string,
      description: string,
    ) {
      const sourceContract = lookupAgoricInstance(sourceContractName);

      /** @type {import('../lib/psm.js').OfferSpec} */
      return {
        id: makeOfferId(),
        invitationSpec: {
          source: 'purse',
          instance: sourceContract,
          description,
        },
        proposal: {},
      };
    },
    makeOfferToVote(
      ecOfferId: string,
      chosenPositions: Position[],
      questionHandle,
    ) {
      assert(
        ecOfferId,
        'cannot makeOffer without economicCommittee membership',
      );

      return {
        id: makeOfferId(),
        invitationSpec: {
          source: 'continuing',
          previousOffer: ecOfferId,
          invitationMakerName: 'makeVoteInvitation',
          // (positionList, questionHandle)
          invitationArgs: harden([chosenPositions, questionHandle]),
        },
        proposal: {},
      };
    },
    makeVoteOnPSMParams(
      psmCharterOfferId: string,
      anchorName: string,
      changedParams: Record<string, Amount | Ratio>,
      relativeDeadlineMin: number,
    ) {
      const psmInstance = lookupAgoricInstance(`psm-IST-${anchorName}`);

      assert(
        psmCharterOfferId,
        'cannot makeOffer without PSM charter membership',
      );

      const deadline = absoluteDeadline(relativeDeadlineMin);

      return {
        id: makeOfferId(),
        invitationSpec: {
          source: 'continuing',
          previousOffer: psmCharterOfferId,
          invitationMakerName: 'VoteOnParamChange',
        },
        offerArgs: {
          instance: psmInstance,
          params: changedParams,
          deadline,
        },
        proposal: {},
      };
    },
    makeVoteOnVaultManagerParams(
      charterOfferId: string,
      collateralBrand: Brand,
      changedParams: Record<string, Amount | Ratio>,
      relativeDeadlineMin: number,
    ) {
      const instance = lookupAgoricInstance('VaultFactory');
      assert(charterOfferId, 'cannot makeOffer without charter membership');

      const deadline = absoluteDeadline(relativeDeadlineMin);

      return {
        id: makeOfferId(),
        invitationSpec: {
          source: 'continuing',
          previousOffer: charterOfferId,
          invitationMakerName: 'VoteOnParamChange',
        },
        offerArgs: {
          instance,
          params: changedParams,
          deadline,
          path: { paramPath: { key: { collateralBrand } } },
        },
        proposal: {},
      };
    },
    makeVoteOnVaultDirectorParams(
      charterOfferId: string,
      changedParams: Record<string, Amount | Ratio>,
      relativeDeadlineMin: number,
    ) {
      const instance = lookupAgoricInstance('VaultFactory');
      assert(charterOfferId, 'cannot makeOffer without charter membership');

      const deadline = absoluteDeadline(relativeDeadlineMin);

      return {
        id: makeOfferId(),
        invitationSpec: {
          source: 'continuing',
          previousOffer: charterOfferId,
          invitationMakerName: 'VoteOnParamChange',
        },
        offerArgs: {
          instance,
          params: changedParams,
          deadline,
          path: { paramPath: { key: 'governedParams' } },
        },
        proposal: {},
      };
    },
    makeVoteOnVaultAuctioneerParams(
      charterOfferId: string,
      changedParams: Record<string, RelativeTime | bigint>,
      relativeDeadlineMin: number,
    ) {
      const instance = lookupAgoricInstance('auctioneer');
      assert(charterOfferId, 'cannot makeOffer without charter membership');

      const deadline = absoluteDeadline(relativeDeadlineMin);

      return {
        id: makeOfferId(),
        invitationSpec: {
          source: 'continuing',
          previousOffer: charterOfferId,
          invitationMakerName: 'VoteOnParamChange',
        },
        offerArgs: {
          instance,
          params: changedParams,
          deadline,
          path: { paramPath: { key: 'governedParams' } },
        },
        proposal: {},
      };
    },
    makeVoteOnPausePSMOffers(
      psmCharterOfferId: string,
      anchorName: string,
      toPause: string[],
      relativeDeadlineMin: number,
    ) {
      const psmInstance = lookupAgoricInstance(`psm-IST-${anchorName}`);

      assert(
        psmCharterOfferId,
        'cannot makeOffer without PSM charter membership',
      );

      const deadline = absoluteDeadline(relativeDeadlineMin);

      return {
        id: makeOfferId(),
        invitationSpec: {
          source: 'continuing',
          previousOffer: psmCharterOfferId,
          invitationMakerName: 'VoteOnPauseOffers',
          invitationArgs: [psmInstance, toPause, deadline],
        },
        proposal: {},
      };
    },
    poseBurnIst(
      charterOfferId: string,
      amount: Amount,
      relativeDeadlineMin: number,
    ) {
      const reserveInstance = lookupAgoricInstance('reserve');
      assert(charterOfferId, 'cannot makeOffer without charter membership');

      const deadline = absoluteDeadline(relativeDeadlineMin);

      return {
        id: makeOfferId(),
        invitationSpec: {
          source: 'continuing',
          previousOffer: charterOfferId,
          invitationMakerName: 'VoteOnApiCall',
          invitationArgs: [
            reserveInstance,
            'burnFeesToReduceShortfall',
            [amount],
            deadline,
          ],
        },
        proposal: {},
      };
    },
    makeVoteOnPauseVaultOffers(
      charterOfferId: string,
      toPause: string[],
      relativeDeadlineMin: number,
    ) {
      const instance = lookupAgoricInstance('VaultFactory');
      assert(charterOfferId, 'cannot makeOffer without charter membership');

      const deadline = absoluteDeadline(relativeDeadlineMin);

      return {
        id: makeOfferId(),
        invitationSpec: {
          source: 'continuing',
          previousOffer: charterOfferId,
          invitationMakerName: 'VoteOnPauseOffers',
          invitationArgs: [instance, toPause, deadline],
        },
        proposal: {},
      };
    },
    makeVoteOnPauseLiquidationOffers(
      charterOfferId: string,
      toPause: string[],
      relativeDeadlineMin: number,
    ) {
      const instance = lookupAgoricInstance('auctioneer');
      assert(charterOfferId, 'cannot makeOffer without charter membership');

      const deadline = absoluteDeadline(relativeDeadlineMin);

      return {
        id: makeOfferId(),
        invitationSpec: {
          source: 'continuing',
          previousOffer: charterOfferId,
          invitationMakerName: 'VoteOnPauseOffers',
          invitationArgs: [instance, toPause, deadline],
        },
        proposal: {},
      };
    },
    makeVoteOnAddOracles(
      charterOfferId: string,
      priceFeed: string,
      oracles: string[],
      relativeDeadlineMin: number,
    ) {
      const instance = lookupAgoricInstance(priceFeed);
      assert(charterOfferId, 'cannot makeOffer without charter membership');

      const deadline = absoluteDeadline(relativeDeadlineMin);

      return {
        id: makeOfferId(),
        invitationSpec: {
          source: 'continuing',
          previousOffer: charterOfferId,
          invitationMakerName: 'VoteOnApiCall',
          invitationArgs: [instance, 'addOracles', [oracles], deadline],
        },
        proposal: {},
      };
    },
    makeVoteOnRemoveOracles(
      charterOfferId: string,
      priceFeed: string,
      oracles: string[],
      relativeDeadlineMin: number,
    ) {
      const instance = lookupAgoricInstance(priceFeed);
      assert(charterOfferId, 'cannot makeOffer without charter membership');

      const deadline = absoluteDeadline(relativeDeadlineMin);

      return {
        id: makeOfferId(),
        invitationSpec: {
          source: 'continuing',
          previousOffer: charterOfferId,
          invitationMakerName: 'VoteOnApiCall',
          invitationArgs: [instance, 'removeOracles', [oracles], deadline],
        },
        proposal: {},
      };
    },
    prepareToSign() {
      console.log('will sign with', chainKit.signer);

      async () => {
        try {
          const stuff = await chainKit.signer.getSequence();
          console.log({ sequence: stuff });
        } catch (notOnChain) {
          console.error('getSequence', notOnChain);
          alert(notOnChain.message);
        }
      };
    },
    sendOffer(offer) {
      const toastId = notifySigning();
      const payload = harden({
        method: 'executeOffer',
        offer,
      });

      const capData = marshal.serialize(payload);
      console.log('submitting spend action', capData, 'for offer', offer);
      const message = JSON.stringify(capData);

      return chainKit.signer
        .submitSpendAction(message)
        .then(tx => {
          notifySuccess(toastId, agoricNet, tx);
        })
        .catch(err => notifyError(toastId, err));
    },
  };
};

const usp = new URLSearchParams(window.location.search);
const agoricNet = usp.get('agoricNet') || 'devnet';
console.log('RPC server:', agoricNet);
export const rpcUtils = await makeRpcUtils({ agoricNet });

const { keplr } = window as import('@keplr-wallet/types').Window;
if (!keplr) {
  window.alert('requires Keplr extension');
  assert.fail('missing keplr');
}

export const walletUtils = await makeWalletUtils(rpcUtils, keplr);

export const WalletContext = React.createContext(walletUtils);

export enum LoadStatus {
  Idle = 'idle',
  Waiting = 'waiting',
  Received = 'received',
}

export const usePublishedKeys = (path: string) => {
  const [status, setStatus] = useState(LoadStatus.Idle);
  const [data, setData] = useState([]);
  const { vstorage } = rpcUtils;

  useEffect(() => {
    const fetchKeys = async () => {
      console.debug('usePublishedKeys reading', `published.${path}`);
      setStatus(LoadStatus.Waiting);
      const keys = await vstorage.keys(`published.${path}`);
      setData(keys);
      setStatus(LoadStatus.Received);
    };
    fetchKeys().catch(console.error);
  }, [path, vstorage]);

  return { status, data };
};

export const usePublishedDatum = (path: string) => {
  const [status, setStatus] = useState(LoadStatus.Idle);
  const [data, setData] = useState({} as any);

  useEffect(() => {
    const { storageWatcher } = rpcUtils;

    setStatus(LoadStatus.Waiting);

    return storageWatcher.watchLatest(
      [AgoricChainStoragePathKind.Data, `published.${path}`],
      value => {
        setData(value);
        setStatus(LoadStatus.Received);
      },
      e => console.error('useEffect error', path, e),
    );
  }, [path]);

  return { status, data };
};

export const usePublishedHistory = (path: string) => {
  const [status, setStatus] = useState(LoadStatus.Idle);
  const [data, setData] = useState([]);
  const walletUtils = useContext(WalletContext);

  useEffect(() => {
    const { follow } = rpcUtils;
    const fetchData = async () => {
      console.debug('usePublishedDatum following', `:published.${path}`);
      const follower = await follow(`:published.${path}`);
      const iterable: AsyncIterable<Record<string, unknown>> =
        await follower.getReverseIterable();
      setStatus(LoadStatus.Waiting);
      const items = [];
      for await (const { value } of iterable) {
        items.push(value);
      }
      setData(items);
      setStatus(LoadStatus.Received);
    };
    fetchData().catch(e => console.error('useEffect error', e));
  }, [path, walletUtils]);

  return { status, data };
};

type BrandDescriptor = {
  brand: Brand;
  displayInfo: DisplayInfo;
  issuer: ERef<Issuer>;
  petname: string | string[];
};

type LegacyOfferToUsedInvitation = Record<number, Amount>;
type CurrentWalletRecord = {
  brands: BrandDescriptor[];
  purses: Array<{ brand: Brand; balance: Amount }>;
  offerToUsedInvitation: Array<[string, Amount]> | LegacyOfferToUsedInvitation;
};

const coerceEntries = mapOrEntries => {
  if (Array.isArray(mapOrEntries)) return mapOrEntries;
  return Object.entries(mapOrEntries);
};

export const inferInvitationStatus = (
  current: CurrentWalletRecord | undefined,
  descriptionSubstr: string,
) => {
  if (!current?.offerToUsedInvitation) {
    return { status: 'nodata' };
  }
  // first check for accepted
  const usedInvitationEntry = coerceEntries(current.offerToUsedInvitation).find(
    ([_, invitationAmount]) =>
      invitationAmount.value[0].description.includes(descriptionSubstr),
  );
  if (usedInvitationEntry) {
    return {
      status: 'accepted',
      acceptedIn: usedInvitationEntry[0],
    };
  }
  // if that's not available, see if there's an invitation that can be used

  const invitationPurse = current.purses.find(p => {
    // xxx take this as param
    return p.brand.toString().includes('Invitation');
  });

  const invitation: Amount<'set'> | undefined =
    invitationPurse.balance.value.find(a =>
      a.description.includes(descriptionSubstr),
    );
  if (invitation) {
    return {
      status: 'available',
      invitation,
    };
  }

  // no record of an invitation
  return {
    status: 'missing',
  };
};
