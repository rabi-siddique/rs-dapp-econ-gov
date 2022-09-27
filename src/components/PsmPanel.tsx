import { Listbox } from '@headlessui/react';
import { useAtom } from 'jotai';
import { WalletContext } from 'lib/wallet';
import { useContext, useState } from 'react';
import { selectedAnchorPetnameAtom } from 'store/swap';
import AcceptInvitation from './AcceptInvitation';
import PsmGovernance from './PsmGovernance';

// TODO fetch list from RPC
const anchors = ['AUSD'];

interface Props {}

export default function PsmPanel(_props: Props) {
  const [anchorName, setAnchorName] = useState(anchors[0]);
  const walletUtils = useContext(WalletContext);
  const invitationRecord = walletUtils.invitationLike(
    'PSM charter member invitation'
  );
  const [selectedAnchorBrandPetname, _setSelectedAnchorBrandPetname] = useAtom(
    selectedAnchorPetnameAtom
  );

  console.log('rendering PsmPanel', {
    invitationRecord,
    selectedAnchorBrandPetname,
  });
  if (!invitationRecord) {
    return (
      <p>You must first have received an invitation to the PSM Charter.</p>
    );
  }
  if (!invitationRecord.acceptedIn) {
    return (
      <div>
        To vote you will need to accept your invitation to the PSM Charter.
        <AcceptInvitation
          description={invitationRecord.description}
          // TODO validate earlier that this invitation is from this contract
          sourceContract="psmCharter"
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
      <Listbox value={anchorName} onChange={setAnchorName}>
        <Listbox.Button>{anchorName}</Listbox.Button>
        <Listbox.Options>
          {anchors.map(name => (
            <Listbox.Option key={name} value={name}>
              {name}
            </Listbox.Option>
          ))}
        </Listbox.Options>

        <PsmGovernance anchorName={anchorName} />
      </Listbox>
    </div>
  );
}
