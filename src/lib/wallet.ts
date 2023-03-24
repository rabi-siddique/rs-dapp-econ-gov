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
import { boardSlottingMarshaller, networkConfigUrl, RpcUtils } from './rpc';
import { makeRpcUtils } from './rpc.js';

const marshaller = boardSlottingMarshaller();

export const charterInvitationSpec = {
  instanceName: 'econCommitteeCharter',
  description: 'charter member invitation',
};

const absoluteDeadline = (relativeDeadlineMin: number) =>
  BigInt(relativeDeadlineMin * 60 + Math.round(Date.now() / 1000));

export const makeWalletUtils = async (rpcUtils: RpcUtils, keplr: Keplr) => {
  const { agoricNames, fromBoard } = rpcUtils;
  const makeChainKit = async () => {
    const chainInfo: ChainInfo = await suggestChain(
      networkConfigUrl(agoricNet),
      {
        fetch: window.fetch,
        keplr,
        random: Math.random,
      },
    );

    const signer = await makeInteractiveSigner(
      chainInfo,
      keplr,
      AmbientClient.connectWithSigner,
    );

    return {
      chainInfo,
      fromBoard,
      signer,
    };
  };

  const chainKit = await makeChainKit();
  console.log({ chainKit });

  const walletKey = await keplr.getKey(chainKit.chainInfo.chainId);

  // TODO query RPC for the high water mark
  const nextOfferId = () => {
    // xxx some message was sent in milliseconds so the high water got very high
    return Date.now();
  };

  return {
    agoricNet,
    chainKit,
    rpcUtils,
    getWalletAddress() {
      return walletKey.bech32Address;
    },
    makeOfferToAcceptInvitation(
      sourceContractName: string,
      description: string,
    ) {
      const sourceContract = agoricNames.instance[sourceContractName];
      assert(sourceContract, `missing contract ${sourceContractName}`);

      /** @type {import('../lib/psm.js').OfferSpec} */
      return {
        id: nextOfferId(),
        invitationSpec: {
          source: 'purse',
          instance: sourceContract,
          description,
        },
        proposal: {},
      };
    },
    makeOfferToVote(
      ecOfferId: number,
      chosenPositions: Position[],
      questionHandle,
    ) {
      const ecInstance = agoricNames.instance['economicCommittee'];
      assert(ecInstance, 'no contract instance for economicCommittee');

      assert(
        ecOfferId,
        'cannot makeOffer without economicCommittee membership',
      );

      return {
        id: nextOfferId(),
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
      psmCharterOfferId: number,
      anchorName: string,
      changedParams: Record<string, Amount | Ratio>,
      relativeDeadlineMin: number,
    ) {
      const psmInstance = agoricNames.instance[`psm-IST-${anchorName}`];
      assert(psmInstance, `no PSM contract instance for IST.${anchorName}`);

      assert(
        psmCharterOfferId,
        'cannot makeOffer without PSM charter membership',
      );

      const deadline = absoluteDeadline(relativeDeadlineMin);

      return {
        id: nextOfferId(),
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
      charterOfferId: number,
      collateralBrand: Brand,
      changedParams: Record<string, Amount | Ratio>,
      relativeDeadlineMin: number,
    ) {
      const instance = agoricNames.instance['VaultFactory'];
      assert(instance, `no VaultFactory instance found`);
      assert(charterOfferId, 'cannot makeOffer without charter membership');

      const deadline = absoluteDeadline(relativeDeadlineMin);

      return {
        id: nextOfferId(),
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
      charterOfferId: number,
      changedParams: Record<string, Amount | Ratio>,
      relativeDeadlineMin: number,
    ) {
      const instance = agoricNames.instance['VaultFactory'];
      assert(instance, `no VaultFactory instance found`);
      assert(charterOfferId, 'cannot makeOffer without charter membership');

      const deadline = absoluteDeadline(relativeDeadlineMin);

      return {
        id: nextOfferId(),
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
      psmCharterOfferId: number,
      anchorName: string,
      toPause: string[],
      relativeDeadlineMin: number,
    ) {
      const psmInstance = agoricNames.instance[`psm-IST-${anchorName}`];
      assert(psmInstance, `no PSM contract instance for IST.${anchorName}`);

      assert(
        psmCharterOfferId,
        'cannot makeOffer without PSM charter membership',
      );

      const deadline = absoluteDeadline(relativeDeadlineMin);

      return {
        id: nextOfferId(),
        invitationSpec: {
          source: 'continuing',
          previousOffer: psmCharterOfferId,
          invitationMakerName: 'VoteOnPauseOffers',
          invitationArgs: [psmInstance, toPause, deadline],
        },
        proposal: {},
      };
    },
    makeBurnIstOffer(
      charterOfferId: number,
      amount: Amount,
      relativeDeadlineMin: number,
    ) {
      console.log('BRAND', amount.brand);
      console.log('VALUE', amount.value, typeof amount.value);
      const reserveInstance = agoricNames.instance['reserve'];
      assert(reserveInstance, `no instance found for reserve`);

      assert(charterOfferId, 'cannot makeOffer without charter membership');

      const deadline = absoluteDeadline(relativeDeadlineMin);

      return {
        id: nextOfferId(),
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
      charterOfferId: number,
      toPause: string[],
      relativeDeadlineMin: number,
    ) {
      const instance = agoricNames.instance['VaultFactory'];
      assert(instance, `no VaultFactory instance found`);
      assert(charterOfferId, 'cannot makeOffer without charter membership');

      const deadline = absoluteDeadline(relativeDeadlineMin);

      return {
        id: nextOfferId(),
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
      charterOfferId: number,
      priceFeed: string,
      oracles: string[],
      relativeDeadlineMin: number,
    ) {
      const instance = agoricNames.instance[priceFeed];
      assert(instance, `price feed instance ${priceFeed} not found`);
      assert(charterOfferId, 'cannot makeOffer without charter membership');

      const deadline = absoluteDeadline(relativeDeadlineMin);

      return {
        id: nextOfferId(),
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
      charterOfferId: number,
      priceFeed: string,
      oracles: string[],
      relativeDeadlineMin: number,
    ) {
      const instance = agoricNames.instance[priceFeed];
      assert(instance, `price feed instance ${priceFeed} not found`);
      assert(charterOfferId, 'cannot makeOffer without charter membership');

      const deadline = absoluteDeadline(relativeDeadlineMin);

      return {
        id: nextOfferId(),
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
      const payload = {
        method: 'executeOffer',
        offer,
      };

      const capData = marshaller.serialize(payload);
      console.log('submitting spend action', capData, 'for offer', offer);
      const message = JSON.stringify(capData);

      return chainKit.signer
        .submitSpendAction(message)
        .then(tx => {
          notifySuccess(toastId, tx);
        })
        .catch(err => notifyError(toastId, err));
    },
  };
};

const usp = new URLSearchParams(window.location.search);
const agoricNet = usp.get('agoricNet') || 'devnet';
console.log('RPC server:', agoricNet);
export const rpcUtils = await makeRpcUtils({ agoricNet });

export const transactionInfoUrl = (transactionHash: string) => {
  switch (agoricNet) {
    case 'main':
      return `https://bigdipper.live/agoric/transactions/${transactionHash}`;
    default:
      return `https://${agoricNet}.explorer.agoric.net/agoric/tx/${transactionHash}`;
  }
};

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
  const walletUtils = useContext(WalletContext);

  // XXX cleanup? await next?
  useEffect(() => {
    const { follow } = rpcUtils;
    const fetchData = async () => {
      console.debug('usePublishedDatum following', `:published.${path}`);
      const follower = await follow(`:published.${path}`);
      const iterable: AsyncIterable<Record<string, unknown>> =
        await follower.getLatestIterable();
      const iterator = iterable[Symbol.asyncIterator]();
      setStatus(LoadStatus.Waiting);
      const { value: publishedValue } = await iterator.next();
      setData(publishedValue.value);
      setStatus(LoadStatus.Received);
    };
    fetchData().catch(e => console.error('useEffect error', e));
  }, [path, walletUtils]);

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
      acceptedIn: Number(usedInvitationEntry[0]),
    };
  }
  // if that's not available, see if there's an invitation that can be used

  const invitationPurse = current.purses.find(p =>
    // xxx take this as param
    // @ts-expect-error RpcRemote
    p.brand.iface.includes('Invitation'),
  );

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
