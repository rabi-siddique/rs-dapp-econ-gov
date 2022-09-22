import './installSesLockdown';
import 'ses';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { localWalleUtils, WalletContext } from 'lib/wallet';

const smartWalletProvisioned = await localWalleUtils.isWalletProvisioned();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletContext.Provider value={localWalleUtils}>
      <App smartWalletProvisioned={smartWalletProvisioned} />
    </WalletContext.Provider>
  </React.StrictMode>
);
