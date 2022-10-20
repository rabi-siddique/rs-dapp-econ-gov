import { Listbox } from '@headlessui/react';
import { useAtom } from 'jotai';
import {
  inferInvitationStatus,
  psmCharterInvitationSpec,
  usePublishedDatum,
  WalletContext,
} from 'lib/wallet';
import { useContext, useState } from 'react';
import { selectedAnchorPetnameAtom } from 'store/swap';
import AcceptInvitation from './AcceptInvitation';
import ProposeParamChange from './ProposeParamChange';
import ProposePauseOffers from './ProposePauseOffers';
import { OfferId } from './questions.js';

// TODO fetch list from RPC
const anchors = ['AUSD', 'USDC_axl', 'USDC_grv', 'ToyUSD'];

interface Props {}

export default function PsmPanel(_props: Props) {
  const [anchorName, setAnchorName] = useState(anchors[0]);
  const walletUtils = useContext(WalletContext);
  const { data } = usePublishedDatum(
    `wallet.${walletUtils.getWalletAddress()}.current`
  );
  const [selectedAnchorBrandPetname, _setSelectedAnchorBrandPetname] = useAtom(
    selectedAnchorPetnameAtom
  );

  console.debug('rendering PsmPanel', {
    data,
    selectedAnchorBrandPetname,
  });

  const invitationStatus = inferInvitationStatus(
    data,
    psmCharterInvitationSpec.description
  );
  if (invitationStatus.status === 'nodata') {
    return <p>Loading…</p>;
  }
  if (invitationStatus.status === 'missing') {
    return (
      <p>You must first have received an invitation to the PSM Charter.</p>
    );
  }
  if (invitationStatus.status === 'available') {
    return (
      <div>
        To vote you will need to accept your invitation to the PSM Charter.
        <AcceptInvitation
          // @ts-expect-error invitation type
          description={invitationStatus.invitation.description}
          // TODO validate earlier that this invitation is from this contract
          sourceContract={psmCharterInvitationSpec.instanceName}
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

          <ProposeParamChange
            psmCharterOfferId={previousOfferId}
            anchorName={anchorName}
          />
          <ProposePauseOffers
            psmCharterOfferId={previousOfferId}
            anchorName={anchorName}
          />
        </Listbox>
      </div>
    </div>
  );
}
