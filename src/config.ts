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
