import AcceptInvitation from './AcceptInvitation';
import { OfferId } from './questions.js';
import { charterInvitationSpec } from 'lib/wallet';
import type { inferInvitationStatus } from 'lib/wallet';

export default function CharterGuidance({
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
          To propose you must first have received an invitation to the Econ
          Committee Charter.
        </p>
      );
    case 'available':
      return (
        <div className="rounded-lg py-5 px-6 text-base mb-3 bg-yellow-100 text-yellow-700">
          To propose you will need to accept your invitation to the Econ
          Committee Charter.
          <AcceptInvitation
            description={(invitation as any).description}
            // TODO validate earlier that this invitation is from this contract
            sourceContract={charterInvitationSpec.instanceName}
          />
          And then <b>reload the page</b>.
        </div>
      );
    case 'accepted':
      return (
        <p className="rounded-lg py-5 px-6 text-base mb-3 bg-green-100 text-green-700">
          You may propose using the invitation makers from offer{' '}
          <OfferId id={acceptedIn} />
        </p>
      );
    default:
      return <strong>unknown status {status}</strong>;
  }
}
