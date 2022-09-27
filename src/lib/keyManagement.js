// TODO source from sdk
// @ts-check
import { fromBase64, fromBech32, toBase64, toBech32 } from '@cosmjs/encoding';
import { Registry } from '@cosmjs/proto-signing';
import {
  AminoTypes,
  assertIsDeliverTxSuccess,
  createAuthzAminoConverters,
  createBankAminoConverters,
  defaultRegistryTypes,
} from '@cosmjs/stargate';

import { MsgWalletAction, MsgWalletSpendAction } from './cosmicProtoMessages';

import { GenericAuthorization } from 'cosmjs-types/cosmos/authz/v1beta1/authz.js';
import { bech32Config, stableCurrency } from './chainInfo';

/** @type {(address: string) => Uint8Array} */
export function toAccAddress(address) {
  return fromBech32(address).data;
}

/**
 * The typeUrl of a message pairs a package name with a message name.
 * For example, from:
 *
 * package cosmos.authz.v1beta1;
 * message MsgGrant { ... }
 *
 * we get `/cosmos.authz.v1beta1.MsgGrant`
 *
 * https://github.com/cosmos/cosmos-sdk/blob/main/proto/cosmos/authz/v1beta1/tx.proto#L34
 * https://github.com/cosmos/cosmos-sdk/blob/00805e564755f696c4696c6abe656cf68678fc83/proto/cosmos/authz/v1beta1/tx.proto#L34
 */
const CosmosMessages = /** @type {const} */ ({
  bank: {
    MsgSend: {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    },
  },
  authz: {
    MsgGrant: {
      typeUrl: '/cosmos.authz.v1beta1.MsgGrant',
    },
    GenericAuthorization: {
      typeUrl: '/cosmos.authz.v1beta1.GenericAuthorization',
    },
    MsgExec: {
      typeUrl: '/cosmos.authz.v1beta1.MsgExec',
    },
  },
  feegrant: {
    MsgGrantAllowance: {
      typeUrl: '/cosmos.feegrant.v1beta1.MsgGrantAllowance',
    },
    BasicAllowance: {
      typeUrl: '/cosmos.feegrant.v1beta1.BasicAllowance',
    },
  },
});

/**
 * `/agoric.swingset.XXX` matches package agoric.swingset in swingset/msgs.go
 */
export const SwingsetMsgs = /** @type {const} */ ({
  MsgWalletAction: {
    typeUrl: '/agoric.swingset.MsgWalletAction',
    aminoType: 'swingset/WalletAction',
  },
  MsgWalletSpendAction: {
    typeUrl: '/agoric.swingset.MsgWalletSpendAction',
    aminoType: 'swingset/WalletAction',
  },
});

/**
 * @typedef {{
 *   owner: string, // base64 of raw bech32 data
 *   action: string,
 * }} WalletAction
 * @typedef {{
 *   owner: string, // base64 of raw bech32 data
 *   spendAction: string,
 * }} WalletSpendAction
 */

export const SwingsetRegistry = new Registry([
  ...defaultRegistryTypes,
  // XXX should this list be "upstreamed" to @agoric/cosmic-proto?
  [SwingsetMsgs.MsgWalletAction.typeUrl, MsgWalletAction],
  [SwingsetMsgs.MsgWalletSpendAction.typeUrl, MsgWalletSpendAction],
]);

/**
 * TODO: estimate fee? use 'auto' fee?
 * https://github.com/Agoric/agoric-sdk/issues/5888
 *
 * @returns {import('@cosmjs/stargate').StdFee}
 */
export const zeroFee = () => {
  const { coinMinimalDenom: denom } = stableCurrency;
  const fee = {
    amount: [{ amount: '0', denom }],
    gas: '300000', // TODO: estimate gas?
  };
  return fee;
};

/** @type {import('@cosmjs/stargate').AminoConverters} */
const SwingsetConverters = {
  // TODO: #3628, #4654
  // '/agoric.swingset.MsgProvision': {
  //   /* ... */
  // },
  [SwingsetMsgs.MsgWalletAction.typeUrl]: {
    aminoType: SwingsetMsgs.MsgWalletAction.aminoType,
    toAmino: ({ action, owner }) => ({
      action,
      owner: toBech32(bech32Config.bech32PrefixAccAddr, fromBase64(owner)),
    }),
    fromAmino: ({ action, owner }) => ({
      action,
      owner: toBase64(toAccAddress(owner)),
    }),
  },
  [SwingsetMsgs.MsgWalletSpendAction.typeUrl]: {
    aminoType: SwingsetMsgs.MsgWalletAction.aminoType,
    toAmino: ({ spendAction, owner }) => ({
      spendAction,
      owner: toBech32(bech32Config.bech32PrefixAccAddr, fromBase64(owner)),
    }),
    fromAmino: ({ spendAction, owner }) => ({
      spendAction,
      owner: toBase64(toAccAddress(owner)),
    }),
  },
};

/**
 * @param {string} granter bech32 address
 * @param {string} grantee bech32 address
 * @param {number} seconds expiration as seconds (Date.now() / 1000)
 */
const makeGrantWalletActionMessage = (granter, grantee, seconds) => {
  return {
    typeUrl: CosmosMessages.authz.MsgGrant.typeUrl,
    value: {
      granter,
      grantee,
      grant: {
        authorization: {
          typeUrl: CosmosMessages.authz.GenericAuthorization.typeUrl,
          value: GenericAuthorization.encode(
            GenericAuthorization.fromPartial({
              msg: SwingsetMsgs.MsgWalletAction.typeUrl,
            })
          ).finish(),
        },
        expiration: { seconds },
      },
    },
  };
};

/**
 * Use Keplr to sign offers and delegate object messaging to local storage key.
 *
 * Ref: https://docs.keplr.app/api/
 *
 * @param {import('@keplr-wallet/types').ChainInfo} chainInfo
 * @param {NonNullable<KeplrWindow['keplr']>} keplr
 * @param {typeof import('@cosmjs/stargate').SigningStargateClient.connectWithSigner} connectWithSigner
 * @typedef {import('@keplr-wallet/types').Window} KeplrWindow
 */
export const makeInteractiveSigner = async (
  chainInfo,
  keplr,
  connectWithSigner
) => {
  const { chainId } = chainInfo;

  const key = await keplr.getKey(chainId);

  const offlineSigner = await keplr.getOfflineSignerAuto(chainId);
  console.log('InteractiveSigner', { offlineSigner });

  // Currently, Keplr extension manages only one address/public key pair.
  const [account] = await offlineSigner.getAccounts();
  const { address } = account;

  const converters = {
    ...SwingsetConverters,
    ...createBankAminoConverters(),
    ...createAuthzAminoConverters(),
  };
  const signingClient = await connectWithSigner(chainInfo.rpc, offlineSigner, {
    aminoTypes: new AminoTypes(converters),
    registry: SwingsetRegistry,
  });
  console.debug('InteractiveSigner', { signingClient, address });

  const fee = zeroFee();

  return harden({
    address, // TODO: address can change
    isNanoLedger: key.isNanoLedger,

    /**
     * TODO: integrate support for fee-account in MsgExec
     * https://github.com/cosmos/cosmjs/issues/1155
     * https://github.com/cosmos/cosmjs/pull/1159
     *
     * @param {string} grantee
     * @param {number} t0 current time (as from Date.now()) as basis for 4hr expiration
     */
    delegateWalletAction: async (grantee, t0) => {
      const expiration = t0 / 1000 + 4 * 60 * 60;

      // TODO: support for fee-account in MsgExec
      console.warn(
        'cannot yet makeFeeGrantMessage',
        '(using feeGrantWorkAround)'
      );

      const feeGrantWorkAround = {
        typeUrl: CosmosMessages.bank.MsgSend.typeUrl,
        value: {
          fromAddress: address,
          toAddress: grantee,
          amount: [{ denom: 'ubld', amount: '25000' }],
        },
      };

      /** @type {import('@cosmjs/proto-signing').EncodeObject[]} */
      const msgs = [
        // TODO: makeFeeGrantMessage(address, grantee, allowance, expiration),
        feeGrantWorkAround,
        makeGrantWalletActionMessage(address, grantee, expiration),
      ];

      console.log('sign Grant', { address, msgs, fee });
      const tx = await signingClient.signAndBroadcast(address, msgs, fee);
      console.log('Grant sign result tx', tx);
      assertIsDeliverTxSuccess(tx);

      return tx;
    },

    getSequence: () => signingClient.getSequence(address),

    /**
     * Sign and broadcast WalletSpendAction
     *
     * @param {string} spendAction marshaled offer
     * @throws if account does not exist on chain, user cancels,
     *         RPC connection fails, RPC service fails to broadcast (
     *         for example, if signature verification fails)
     */
    submitSpendAction: async spendAction => {
      const { accountNumber, sequence } = await signingClient.getSequence(
        address
      );
      console.log({ accountNumber, sequence });

      const act1 = {
        typeUrl: SwingsetMsgs.MsgWalletSpendAction.typeUrl,
        /** @type {WalletSpendAction} */
        value: {
          owner: toBase64(toAccAddress(address)),
          spendAction,
        },
      };

      const msgs = [act1];
      console.log('sign spend action', { address, msgs, fee });

      const tx = await signingClient.signAndBroadcast(address, msgs, fee);
      console.log('spend action result tx', tx);
      assertIsDeliverTxSuccess(tx);

      return tx;
    },
  });
};
