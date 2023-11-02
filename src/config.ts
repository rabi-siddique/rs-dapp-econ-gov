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
      return `https://bigdipper.live/agoric/accounts/${account}`;
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
      return `https://bigdipper.live/agoric/transactions/${transactionHash}`;
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
export const archivingAlternative = (rpcHost: string) => {
  switch (rpcHost) {
    case 'https://agoric-rpc.polkachu.com:443':
    case 'https://main.rpc.agoric.net:443':
      return 'https://main-a.rpc.agoric.net:443';
    default:
      return rpcHost;
  }
};
