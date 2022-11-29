export const dappConfig = {
  CONTRACT_NAME: 'PSM',
  INSTANCE_PREFIX: ':published.psm.IST.',
  INSTANCES_KEY: ':published.agoricNames.instance',
};

export const wellKnownBrands = {
  board0188: { petname: 'USDT_axl', decimalPlaces: 6 },
  board0223: { petname: 'USDC_axl', decimalPlaces: 6 },
  board02314: { petname: 'IST', decimalPlaces: 6 },
  board02810: { petname: 'USDT_grv', decimalPlaces: 6 },
  board04312: { petname: 'BLD', decimalPlaces: 6 },
  board05311: { petname: 'AUSD', decimalPlaces: 6 },
  board0566: { petname: 'USDC_grv', decimalPlaces: 6 },
} as Record<string, { petname: string; decimalPlaces: number }>;
