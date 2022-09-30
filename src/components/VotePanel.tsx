import {
  inferInvitationStatus,
  usePublishedDatum,
  WalletContext,
} from 'lib/wallet';
import { useContext } from 'react';
import AcceptInvitation from './AcceptInvitation';
import { OfferId, VoteOnLatestQuestion } from './questions';

interface Props {}

export default function VotePanel(_props: Props) {
  const walletUtils = useContext(WalletContext);
  const { data } = usePublishedDatum(
    `wallet.${walletUtils.getWalletAddress()}.current`
  );

  const invitationStatus = inferInvitationStatus(data, 'Voter');
  if (invitationStatus.status === 'nodata') {
    return <p>Loading…</p>;
  }
  if (invitationStatus.status === 'missing') {
    return (
      <p>
        You must first have received an invitation to the Economic Committee.
      </p>
    );
  }
  if (invitationStatus.status === 'available') {
    return (
      <div>
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
  }

  assert(invitationStatus.status === 'accepted');
  const previousOfferId = invitationStatus.acceptedIn;

  return (
    <div>
      <p>
        You may vote using the invitation makers from offer{' '}
        <OfferId id={previousOfferId} />
      </p>
      <VoteOnLatestQuestion ecOfferId={previousOfferId} />
    </div>
  );
}
