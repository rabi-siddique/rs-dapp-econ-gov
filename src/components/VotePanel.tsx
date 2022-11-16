import {
  inferInvitationStatus,
  usePublishedDatum,
  WalletContext,
} from 'lib/wallet';
import { useContext } from 'react';
import { motion } from 'framer-motion';
import AcceptInvitation from './AcceptInvitation';
import { OfferId, VoteOnLatestQuestion } from './questions';

interface Props {}

export default function VotePanel(_props: Props) {
  const walletUtils = useContext(WalletContext);
  const { data } = usePublishedDatum(
    `wallet.${walletUtils.getWalletAddress()}.current`
  );

  let eligibility = <p>Loading…</p>;

  const invitationStatus = inferInvitationStatus(data, 'Voter');
  const previousOfferId = invitationStatus.acceptedIn;

  if (invitationStatus.status === 'missing') {
    eligibility = (
      <p className="rounded-lg py-5 px-6 text-base mb-3 bg-red-100 text-red-700">
        You must first have received an invitation to the Economic Committee.
      </p>
    );
  } else if (invitationStatus.status === 'available') {
    eligibility = (
      <div className="rounded-lg py-5 px-6 text-base mb-3 bg-yellow-100 text-yellow-700">
        To vote you will need to accept your invitation to the Economic
        Committee.
        <AcceptInvitation
          // @ts-expect-error invitation type
          description={invitationStatus.invitation.description}
          // TODO validate earlier that this invitation is from this contract
          sourceContract="economicCommittee"
        />
        And then <b>reload the page</b>.
      </div>
    );
  } else if (invitationStatus.status === 'accepted') {
    eligibility = (
      <p className="rounded-lg py-5 px-6 text-base mb-3 bg-green-100 text-green-700">
        You may vote using the invitation makers from offer{' '}
        <OfferId id={previousOfferId} />
      </p>
    );
  }

  return (
    <div>
      <motion.div layout>{eligibility}</motion.div>
      <motion.div layout="position">
        {invitationStatus.status === 'accepted' && previousOfferId && (
          <VoteOnLatestQuestion ecOfferId={previousOfferId} />
        )}
      </motion.div>
    </div>
  );
}
