import { makeReactAgoricWalletConnection } from '@agoric/web-components/react';
import { E } from '@endo/eventual-send';
import clsx from 'clsx';
import { dappConfig } from 'config';
import { useAtom } from 'jotai';
import React, { useCallback } from 'react';
import { walletAtom } from 'store/app';

// Create a wrapper for agoric-wallet-connection that is specific to
// the app's instance of React.
const AgoricWalletConnection = makeReactAgoricWalletConnection(React);

const WalletConnection = () => {
  const { CONTRACT_NAME } = dappConfig;
  const [wallet, setWallet] = useAtom(walletAtom);

  const onWalletState = useCallback(
    (ev: any) => {
      const { walletConnection, state } = ev.detail;
      console.log('wallet state:', state);
      // FIXME: Better state management, including in the web component level.
      switch (state) {
        case 'idle': {
          // XXX scope not right, maybe ignored?
          const bridge = E(walletConnection).getScopedBridge(CONTRACT_NAME);
          // You should reconstruct all state here.
          // @ts-expect-error ???
          setWallet(bridge);
          break;
        }
        case 'error': {
          console.log('error', ev.detail);
          // In case of an error, reset to 'idle'.
          // Backoff or other retry strategies would go here instead of immediate reset.
          E(walletConnection).reset();
          break;
        }
        default:
      }
    },
    [CONTRACT_NAME, setWallet]
  );

  return (
    <AgoricWalletConnection
      onState={onWalletState}
      useLocalStorage={true}
      style={{ display: wallet && 'none' }}
    />
  );
};

export default WalletConnection;
