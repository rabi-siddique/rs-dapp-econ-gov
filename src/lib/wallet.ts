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

import { Amount } from '@agoric/ertp';
import { Ratio } from '@agoric/zoe/src/contractSupport';

const marshaller = boardSlottingMarshaller();

const psmCharterInvitationSpec = {
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
  const follower = await follow(`:published.wallet.${walletKey.bech32Address}`);

  // xxx mutable
  let state: Awaited<ReturnType<typeof coalesceWalletState>> | undefined;

  function invitationLike(descriptionSubstr: string) {
    const map = state.invitationsReceived as Map<
      string,
      {
        acceptedIn: number;
        description: string;
        instance: { boardId: string };
      }
    >;
    const match = Array.from(map.values()).find(r =>
      r.description.includes(descriptionSubstr)
    );
    return match;
  }

  // TODO query RPC for the high water mark
  const nextOfferId = () => {
    // xxx some message was sent in milliseconds so the high water got very high
    return Date.now();
  };

  return {
    chainKit,
    follow,
    async isWalletProvisioned() {
      state = await coalesceWalletState(follower);

      console.log('isWalletProvisioned', { state });

      return !!state;
    },
    getWalletAddress() {
      return walletKey.bech32Address;
    },
    invitationLike,
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
    makeOfferToVote(chosenPositions: unknown[], questionHandle) {
      const ecInstance = agoricNames.instance['economicCommittee'];
      assert(ecInstance, 'no contract instance for economicCommittee');

      const invitationRecord = invitationLike('Voter');
      assert(
        invitationRecord,
        'cannot makeOffer without economicCommittee membership'
      );

      return {
        id: nextOfferId(),
        invitationSpec: {
          source: 'continuing',
          previousOffer: invitationRecord.acceptedIn,
          invitationMakerName: 'makeVoteInvitation',
          // (positionList, questionHandle)
          invitationArgs: harden([chosenPositions, questionHandle]),
        },
        proposal: {},
      };
    },
    makeVoteOnParamChange(
      changedParams: Record<string, Amount | Ratio>,
      relativeDeadlineMin: number
    ) {
      const instance =
        agoricNames.instance[psmCharterInvitationSpec.instanceName];
      assert(instance, `missing contract psmCharter`);

      const invitationRecord = invitationLike(
        psmCharterInvitationSpec.description
      );
      assert(
        invitationRecord,
        'cannot makeOffer without PSM charter membership'
      );

      const deadline = BigInt(
        relativeDeadlineMin * 60 + Math.round(Date.now() / 1000)
      );
      return {
        id: nextOfferId(),
        invitationSpec: {
          source: 'continuing',
          previousOffer: invitationRecord.acceptedIn,
          invitationMakerName: 'VoteOnParamChange',
          invitationArgs: [instance, changedParams, deadline],
        },
        proposal: {},
      };
    },
    makeVoteOnPauseOffers(
      anchorName: string,
      toPause: string[],
      relativeDeadlineMin: number
    ) {
      const psmInstance = agoricNames.instance[`psm-IST-${anchorName}`];
      assert(psmInstance, `no PSM contract instance for IST.${anchorName}`);

      const invitationRecord = invitationLike(
        psmCharterInvitationSpec.description
      );
      assert(
        invitationRecord,
        'cannot makeOffer without PSM charter membership'
      );

      const deadline = BigInt(
        relativeDeadlineMin * 60 + Math.round(Date.now() / 1000)
      );

      return {
        id: nextOfferId(),
        invitationSpec: {
          source: 'continuing',
          previousOffer: invitationRecord.acceptedIn,
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
import { coalesceWalletState } from './smart-wallet-utils.js';

export const usePublishedDatum = (path: string) => {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState({} as any);
  const walletUtils = useContext(WalletContext);

  // XXX cleanup? await next?
  useEffect(() => {
    const { follow } = walletUtils;
    const fetchData = async () => {
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
