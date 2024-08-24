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
      'purse park grow equip size away dismiss used evolve live blouse scorpion enjoy crunch combine day second news off crowd broken crop zoo subject',
    gov2Phrase:
      'tilt add stairs mandate extra wash choose fashion earth feature reopen until move lazy carbon pledge sure own comfort this nasty clap tower table',
  },
};

export const getTimeUntilVoteClose = (startTime, minutesForVote) => {
  const totalVoteTime = 60_000 * minutesForVote;
  const voteCloseTime = totalVoteTime + startTime;
  const currentTime = Date.now();
  return voteCloseTime - currentTime;
};
