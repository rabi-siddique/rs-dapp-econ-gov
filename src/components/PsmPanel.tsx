import { Listbox } from '@headlessui/react';
import { useAtom } from 'jotai';
import { WalletContext } from 'lib/wallet';
import { useContext, useState } from 'react';
import { selectedAnchorPetnameAtom } from 'store/swap';
import AcceptInvitation from './AcceptInvitation';
import PsmGovernance from './PsmGovernance';
import ProposePauseOffers from './ProposePauseOffers';

// TODO fetch list from RPC
const anchors = ['AUSD', 'ELLIE'];

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
      <div className="w-full mt-2">
        <Listbox
          as="div"
          className="space-y-1"
          value={anchorName}
          onChange={setAnchorName}
        >
          <Listbox.Label className="block text-sm leading-5 font-medium text-gray-700">
            Anchor
          </Listbox.Label>
          <Listbox.Button className="cursor-default relative w-full rounded-md border border-gray-300 bg-white pl-3 pr-10 py-2 text-left focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition ease-in-out duration-150 sm:text-sm sm:leading-5">
            {anchorName}
          </Listbox.Button>
          <Listbox.Options className="block w-52 text-gray-700 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
            {anchors.map(name => (
              <Listbox.Option key={name} value={name}>
                {name}
              </Listbox.Option>
            ))}
          </Listbox.Options>

          <PsmGovernance anchorName={anchorName} />
          <ProposePauseOffers anchorName={anchorName} />
        </Listbox>
      </div>
    </div>
  );
}
