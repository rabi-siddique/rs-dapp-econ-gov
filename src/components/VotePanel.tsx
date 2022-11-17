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

function Eligibility({
  status,
  invitation,
  acceptedIn,
}: ReturnType<typeof inferInvitationStatus>) {
  switch (status) {
    case 'nodata':
      return <p>Loading…</p>;
    case 'missing':
      return (
        <p className="rounded-lg py-5 px-6 text-base mb-3 bg-red-100 text-red-700">
          You must first have received an invitation to the Economic Committee.
        </p>
      );
    case 'available':
      return (
        <div className="rounded-lg py-5 px-6 text-base mb-3 bg-yellow-100 text-yellow-700">
          To vote you will need to accept your invitation to the Economic
          Committee.
          <AcceptInvitation
            // @ts-expect-error invitation type
            description={invitation.description}
            // TODO validate earlier that this invitation is from this contract
            sourceContract="economicCommittee"
          />
          And then <b>reload the page</b>.
        </div>
      );
    case 'accepted':
      return (
        <p className="rounded-lg py-5 px-6 text-base mb-3 bg-green-100 text-green-700">
          You may vote using the invitation makers from offer{' '}
          <OfferId id={acceptedIn} />
        </p>
      );
    default:
      return <strong>unknown status {status}</strong>;
  }
}

export default function VotePanel(_props: Props) {
  const walletUtils = useContext(WalletContext);
  const { data } = usePublishedDatum(
    `wallet.${walletUtils.getWalletAddress()}.current`
  );
  const { status: instanceStatus, data: instance } = usePublishedDatum(
    'agoricNames.instance'
  );

  const invitationStatus = inferInvitationStatus(data, 'Voter');
  const previousOfferId = invitationStatus.acceptedIn;

  return (
    <div>
      <motion.div layout>
        <Eligibility {...invitationStatus} />
      </motion.div>
      <motion.div layout="position">
        {instanceStatus === 'received' &&
          invitationStatus.status === 'accepted' &&
          previousOfferId && (
            <VoteOnLatestQuestion
              ecOfferId={previousOfferId}
              instance={instance}
            />
          )}
      </motion.div>
    </div>
  );
}
