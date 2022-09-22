import { makeFollower, makeLeader } from '@agoric/casting';
import { coalesceWalletState } from '@agoric/smart-wallet/src/utils.js';
import { SigningStargateClient as AmbientClient } from '@cosmjs/stargate';
import React from 'react';
import { suggestChain } from './chainInfo.js';
import { makeInteractiveSigner } from './keyManagement.js';
import { boardSlottingMarshaller, networkConfig } from './rpc';
import { makeRpcUtils } from './rpc.js';

const marshaller = boardSlottingMarshaller();

export const makeWalletUtils = async (agoricNet: string) => {
  const { keplr } = window as import('@keplr-wallet/types').Window;
  assert(keplr, 'Missing keplr');

  const { agoricNames, fromBoard } = await makeRpcUtils({
    agoricNet,
  });
  const makeChainKit = async (agoricNet: string) => {
    const chainInfo: import('@keplr-wallet/types').ChainInfo =
      await suggestChain(
        // FIXME condition on agoricNet arg
        // XXX requires @agoric/wallet-ui start
        'http://0.0.0.0:3000/wallet/network-config',
        { fetch: window.fetch, keplr, random: Math.random }
      );

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

  const walletKey = await keplr.getKey(chainKit.chainInfo.chainId);

  const unserializer = boardSlottingMarshaller(fromBoard.convertSlotToVal);

  const follower = await makeFollower(
    `:published.wallet.${walletKey.bech32Address}`,
    chainKit.leader,
    {
      unserializer,
    }
  );

  // xxx mutable
  let state:
    | Awaited<ReturnType<typeof coalesceWalletState>>['state']
    | undefined;

  return {
    chainKit,
    async isWalletProvisioned() {
      state = await coalesceWalletState(follower);

      console.log('isWalletProvisioned', { state });

      return !!state;
    },
    invitationLike(descriptionSubstr) {
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
    },
    getWalletAddress() {
      return walletKey.bech32Address;
    },
    makeOfferToAcceptInvitation(
      sourceContractName: string,
      description: string
    ) {
      const sourceContract = agoricNames.instance[sourceContractName];
      assert(sourceContract, `missing contract ${sourceContractName}`);

      // TODO query RPC for the high water mark
      // xxx some message was sent in milliseconds so the high water got very high
      const id = Date.now();

      /** @type {import('../lib/psm.js').OfferSpec} */
      return {
        id,
        invitationSpec: {
          source: 'purse',
          instance: sourceContract,
          description,
        },
        proposal: {},
      };
    },
    makeOfferToVote() {
      // TODO query RPC to get the previous offer ID that endowed the wallet with invitationMakers for voting
      // i.e. the offerStatus that has matching invitationSpec
      const previousInvitationSpec = {
        instanceName: 'economicCommittee',
        // FIXME hard-coded
        description: 'Voter0',
      };
    },
    makeOfferToProposeChange() {
      // TODO query RPC to get the previous offer ID that endowed the wallet with invitationMakers for voting
      // i.e. the offerStatus that has matching invitationSpec
      const previousInvitationSpec = {
        instanceName: 'psmCharter',
        description: 'PSM charter member invitation',
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
      const message = JSON.stringify(capData);

      return chainKit.signer.submitSpendAction(message);
    },
  };
};

// XXX hard-coded
// export const devnetWalleUtils = await makeWalletUtils('devnet');
export const localWalleUtils = await makeWalletUtils('local');

export const WalletContext = React.createContext(localWalleUtils);
