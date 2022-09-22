export const committeeJoinOffer = ({ agoricNames }) => {
  const { economicCommittee } = agoricNames.instance;
  assert(economicCommittee, 'missing economicCommittee');

  const id = Math.round(Date.now() / 1000);

  /** @type {import('../lib/psm.js').OfferSpec} */
  return {
    id,
    invitationSpec: {
      source: 'purse',
      instance: economicCommittee,
      // description: 'Voter0', // XXX it may not always be
    },
    proposal: {},
  };
};
