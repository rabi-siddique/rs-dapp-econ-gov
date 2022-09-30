import { makeFollower, makeLeader } from '@agoric/casting';
import { SigningStargateClient as AmbientClient } from '@cosmjs/stargate';
import React from 'react';
import { suggestChain } from './chainInfo.js';
import { makeInteractiveSigner } from './keyManagement.js';
import {
  boardSlottingMarshaller,
  networkConfig,
  networkConfigUrl,
} from './rpc';
import { makeRpcUtils } from './rpc.js';

import { Amount, Brand, DisplayInfo, Issuer } from '@agoric/ertp';
import { Ratio } from '@agoric/zoe/src/contractSupport';

const marshaller = boardSlottingMarshaller();

export const psmCharterInvitationSpec = {
  instanceName: 'psmCharter',
  description: 'PSM charter member invitation',
};

export const makeWalletUtils = async (agoricNet: string) => {
  const { keplr } = window as import('@keplr-wallet/types').Window;
  if (!keplr) {
    window.alert('requires Keplr extension');
    assert.fail('missing keplr');
  }

  const { agoricNames, fromBoard } = await makeRpcUtils({
    agoricNet,
  });
  const makeChainKit = async (agoricNet: string) => {
    const chainInfo: import('@keplr-wallet/types').ChainInfo =
      await suggestChain(networkConfigUrl(agoricNet), {
        fetch: window.fetch,
        keplr,
        random: Math.random,
      });

    const signer = await makeInteractiveSigner(
      chainInfo,
      keplr,
      AmbientClient.connectWithSigner
    );

    const leader = makeLeader(networkConfig.rpcAddrs[0]);

    return {
      chainInfo,
      agoricNames,
      fromBoard,
      leader,
      signer,
    };
  };

  const chainKit = await makeChainKit(agoricNet);
  console.log({ chainKit });

  const unserializer = boardSlottingMarshaller(fromBoard.convertSlotToVal);

  // XXX factor out of wallet
  // XXX memoize on path
  const follow = (path: string) =>
    makeFollower(path, chainKit.leader, {
      unserializer,
    });

  const walletKey = await keplr.getKey(chainKit.chainInfo.chainId);

  // TODO query RPC for the high water mark
  const nextOfferId = () => {
    // xxx some message was sent in milliseconds so the high water got very high
    return Date.now();
  };

  return {
    chainKit,
    follow,
    getWalletAddress() {
      return walletKey.bech32Address;
    },
    makeOfferToAcceptInvitation(
      sourceContractName: string,
      description: string
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
      chosenPositions: unknown[],
      questionHandle
    ) {
      const ecInstance = agoricNames.instance['economicCommittee'];
      assert(ecInstance, 'no contract instance for economicCommittee');

      assert(
        ecOfferId,
        'cannot makeOffer without economicCommittee membership'
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
    makeVoteOnParamChange(
      psmCharterOfferId: number,
      anchorName: string,
      changedParams: Record<string, Amount | Ratio>,
      relativeDeadlineMin: number
    ) {
      const psmInstance = agoricNames.instance[`psm-IST-${anchorName}`];
      assert(psmInstance, `no PSM contract instance for IST.${anchorName}`);

      assert(
        psmCharterOfferId,
        'cannot makeOffer without PSM charter membership'
      );

      const deadline = BigInt(
        relativeDeadlineMin * 60 + Math.round(Date.now() / 1000)
      );
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
    makeVoteOnPauseOffers(
      psmCharterOfferId: number,
      anchorName: string,
      toPause: string[],
      relativeDeadlineMin: number
    ) {
      const psmInstance = agoricNames.instance[`psm-IST-${anchorName}`];
      assert(psmInstance, `no PSM contract instance for IST.${anchorName}`);

      assert(
        psmCharterOfferId,
        'cannot makeOffer without PSM charter membership'
      );

      const deadline = BigInt(
        relativeDeadlineMin * 60 + Math.round(Date.now() / 1000)
      );

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
      const payload = {
        method: 'executeOffer',
        offer,
      };

      const capData = marshaller.serialize(payload);
      console.log('submitting spend action', capData, 'for offer', offer);
      const message = JSON.stringify(capData);

      return chainKit.signer.submitSpendAction(message);
    },
  };
};

const usp = new URLSearchParams(window.location.search);
const agoricNet = usp.get('agoricNet') || 'devnet';
console.log('RPC server:', agoricNet);
export const walletUtils = await makeWalletUtils(agoricNet);

export const WalletContext = React.createContext(walletUtils);

/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/anchor-has-content */
import { useContext, useEffect, useState } from 'react';
import { ERef } from '@endo/eventual-send';

export const usePublishedDatum = (path: string) => {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState({} as any);
  const walletUtils = useContext(WalletContext);

  // XXX cleanup? await next?
  useEffect(() => {
    const { follow } = walletUtils;
    const fetchData = async () => {
      console.debug('usePublishedDatum following', `:published.${path}`);
      const follower = await follow(`:published.${path}`);
      const iterable: AsyncIterable<Record<string, unknown>> =
        await follower.getLatestIterable();
      const iterator = iterable[Symbol.asyncIterator]();
      setStatus('waiting');
      const { value: publishedValue } = await iterator.next();
      setData(publishedValue.value);
      setStatus('received');
    };
    fetchData().catch(e => console.error('useEffect error', e));
  }, [path, walletUtils]);

  return { status, data };
};

export const usePublishedHistory = (path: string) => {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState([]);
  const walletUtils = useContext(WalletContext);

  useEffect(() => {
    const { follow } = walletUtils;
    const fetchData = async () => {
      console.debug('usePublishedDatum following', `:published.${path}`);
      const follower = await follow(`:published.${path}`);
      const iterable: AsyncIterable<Record<string, unknown>> =
        await follower.getReverseIterable();
      setStatus('waiting');
      const items = [];
      for await (const { value } of iterable) {
        items.push(value);
      }
      setData(items);
      setStatus('received');
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

type CurrentWalletRecord = {
  brands: BrandDescriptor[];
  purses: Array<{ brand: Brand; balance: Amount }>;
  offerToUsedInvitation: Record<number, Amount>;
  lastOfferId: number;
};

export const inferInvitationStatus = (
  current: CurrentWalletRecord | undefined,
  descriptionSubstr: string
) => {
  if (!current?.offerToUsedInvitation) {
    return { status: 'nodata' };
  }
  // first check for accepted
  const usedInvitationEntry = Object.entries(
    current.offerToUsedInvitation
  ).find(([_, invitationAmount]) =>
    invitationAmount.value[0].description.includes(descriptionSubstr)
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
    p.brand.iface.includes('Invitation')
  );

  const invitation: Amount<'set'> | undefined =
    invitationPurse.balance.value.find(a =>
      a.description.includes(descriptionSubstr)
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
