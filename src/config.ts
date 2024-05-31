export const dappConfig = {
  CONTRACT_NAME: 'PSM',
  INSTANCE_PREFIX: ':published.psm.IST.',
  INSTANCES_KEY: ':published.agoricNames.instance',
};

export const supportedNetworks = [
  'main',
  'emerynet',
  'ollinet',
  'devnet',
  'xnet',
  'local',
];

export const accountInfoUrl = (agoricNet: string, account: string) => {
  switch (agoricNet) {
    case 'main':
      return `https://agoric.explorers.guru/account/${account}`;
    default:
      return `https://${agoricNet}.explorer.agoric.net/agoric/account/${account}`;
  }
};

export const transactionInfoUrl = (
  agoricNet: string,
  transactionHash: string,
) => {
  switch (agoricNet) {
    case 'main':
      return `https://agoric.explorers.guru/transaction/${transactionHash}`;
    default:
      return `https://${agoricNet}.explorer.agoric.net/agoric/tx/${transactionHash}`;
  }
};

export const networkConfigUrl = (agoricNetName: string) => {
  if (agoricNetName === 'local') {
    return 'https://wallet.agoric.app/wallet/network-config';
  } else {
    return `https://${agoricNetName}.agoric.net/network-config`;
  }
};

export const rpcUrl = agoricNetSubdomain =>
  `https://${agoricNetSubdomain}.rpc.agoric.net:443`;

/**
 * Look up an archiving version of the host, if available.
 */
export const archivingAlternative = (chainName: string, defaultRpc: string) =>
  chainName === 'agoric-3' ? 'https://main-a.rpc.agoric.net:443' : defaultRpc;

export const networkConfigs = {
  mainnet: {
    label: 'Agoric Mainnet',
    url: 'https://main.agoric.net/network-config',
  },
  testnet: {
    label: 'Agoric Testnet',
    url: 'https://testnet.agoric.net/network-config',
  },
  devnet: {
    label: 'Agoric Devnet',
    url: 'https://devnet.agoric.net/network-config',
  },
  ollinet: {
    label: 'Agoric Ollinet',
    url: 'https://ollinet.agoric.net/network-config',
  },
  emerynet: {
    label: 'Agoric Emerynet',
    url: 'https://emerynet.agoric.net/network-config',
  },
  localhost: {
    label: 'Local Network',
    url: 'https://wallet.agoric.app/wallet/network-config',
  },
};
