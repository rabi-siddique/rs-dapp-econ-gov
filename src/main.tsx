import './installSesLockdown';
import 'ses';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { walletUtils, WalletContext } from 'lib/wallet';

const smartWalletProvisioned = await walletUtils.isWalletProvisioned();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletContext.Provider value={walletUtils}>
      <App smartWalletProvisioned={smartWalletProvisioned} />
    </WalletContext.Provider>
  </React.StrictMode>
);
