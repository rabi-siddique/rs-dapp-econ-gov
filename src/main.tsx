import './installSesLockdown';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { walletUtils, WalletContext } from 'lib/wallet';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WalletContext.Provider value={walletUtils}>
      <App />
    </WalletContext.Provider>
  </React.StrictMode>,
);
