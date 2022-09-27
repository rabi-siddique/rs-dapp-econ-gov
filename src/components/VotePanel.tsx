import { WalletContext } from 'lib/wallet';
import { useContext } from 'react';
import AcceptInvitation from './AcceptInvitation';
import { VoteOnLatestQuestion } from './questions';

interface Props {}

export default function VotePanel(props: Props) {
  const walletUtils = useContext(WalletContext);
  const invitationRecord = walletUtils.invitationLike('Voter');
  console.log('rendering VotePanel', { invitationRecord });
  if (!invitationRecord) {
    return (
      <p>
        You must first have received an invitation to the Economic Committee.
      </p>
    );
  }
  if (!invitationRecord.acceptedIn) {
    return (
      <div>
        To vote you will need to accept your invitation to the Economic
        Committee.
        <AcceptInvitation
          description={invitationRecord.description}
          // TODO validate earlier that this invitation is from this contract
          sourceContract="economicCommittee"
        />
        And then <b>reload the page</b>.
      </div>
    );
  }
  const previousOfferId = invitationRecord.acceptedIn;
  return (
    <div>
      <p>
        You may vote using the invitation makers from offer{' '}
        <code>{previousOfferId}</code>
      </p>
      <VoteOnLatestQuestion />
    </div>
  );
}
