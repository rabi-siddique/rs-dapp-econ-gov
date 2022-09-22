import { Listbox } from '@headlessui/react';
import { WalletContext } from 'lib/wallet';
import { useContext, useState } from 'react';
import AcceptInvitation from './AcceptInvitation';
import PsmGovernance from './PsmGovernance';

// TODO fetch list from RPC
const instances = ['psm-IST-AUSD', 'psm-IST-ELLIE'];

interface Props {}

export default function PsmPanel(props: Props) {
  const walletUtils = useContext(WalletContext);
  const invitationRecord = walletUtils.invitationLike(
    'PSM charter member invitation'
  );
  console.log({ invitationRecord });
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

  const [selectedInstance, setSelectedInstance] = useState(instances[0]);

  return (
    <div>
      <p>
        You may vote using the invitation makers from offer{' '}
        <code>{previousOfferId}</code>
      </p>
      <Listbox value={selectedInstance} onChange={setSelectedInstance}>
        <Listbox.Button>{selectedInstance}</Listbox.Button>
        <Listbox.Options>
          {instances.map(name => (
            <Listbox.Option key={name} value={name}>
              {name}
            </Listbox.Option>
          ))}
        </Listbox.Options>

        <PsmGovernance instanceName={selectedInstance} />
      </Listbox>
    </div>
  );
}
