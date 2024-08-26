export const DEFAULT_TIMEOUT = 2 * 60_000;

export const phrasesList = {
  emerynet: {
    isLocal: false,
    minutes: 3,
    token: 'ToyUSD',
    network: 'emerynet',
    walletAppSelector: 'testnet',
    gov1Phrase: Cypress.env('GOV1_PHRASE'),
    gov2Phrase: Cypress.env('GOV2_PHRASE'),
  },
  devnet: {
    isLocal: false,
    minutes: 3,
    token: 'USDT_axl',
    network: 'devnet',
    walletAppSelector: 'devnet',
    gov1Phrase: Cypress.env('GOV1_PHRASE'),
    gov2Phrase: Cypress.env('GOV2_PHRASE'),
  },
  local: {
    isLocal: true,
    minutes: 1,
    token: 'USDT_axl',
    network: 'local',
    gov1Phrase:
      'such field health riot cost kitten silly tube flash wrap festival portion imitate this make question host bitter puppy wait area glide soldier knee',
    gov2Phrase:
      'physical immune cargo feel crawl style fox require inhale law local glory cheese bring swear royal spy buyer diesel field when task spin alley',
  },
};

export const getTimeUntilVoteClose = (startTime, minutesForVote) => {
  const totalVoteTime = 60_000 * minutesForVote;
  const voteCloseTime = totalVoteTime + startTime;
  const currentTime = Date.now();
  return voteCloseTime - currentTime;
};
