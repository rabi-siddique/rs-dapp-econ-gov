import { Fragment } from 'react';
import clsx from 'clsx';
import { Menu, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import {
  inferInvitationStatus,
  charterInvitationSpec,
  usePublishedDatum,
  WalletContext,
} from 'lib/wallet';
import { useContext, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import VaultParamChange from './VaultParamChange';
import Eligibility from './Eligibility';

const ProposalTypes = {
  managerParamChange: 'Change Manager Params',
  directorParamChange: 'Change Director Params',
  pauseOffers: 'Pause Offers',
  endorseUI: 'Change Endorsed UI',
  manualBurn: 'Burn IST',
};

export default function VaultsPanel() {
  const [proposalType, setProposalType] = useState(
    ProposalTypes.managerParamChange,
  );
  const walletUtils = useContext(WalletContext);
  const { data: walletCurrent } = usePublishedDatum(
    `wallet.${walletUtils.getWalletAddress()}.current`,
  );

  const charterInvitationStatus = inferInvitationStatus(
    walletCurrent,
    charterInvitationSpec.description,
  );
  const charterOfferId = charterInvitationStatus.acceptedIn;

  const body = (() => {
    switch (proposalType) {
      case ProposalTypes.managerParamChange:
        return <VaultParamChange charterOfferId={charterOfferId} />;
      default:
        return <div>TODO</div>;
    }
  })();

  return (
    <div>
      <motion.div layout>
        <Eligibility {...charterInvitationStatus} />
      </motion.div>
      <motion.div layout="position" className="w-full mt-2">
        <div className="p-4 rounded-lg border border-gray-200 shadow-md">
          <Menu as="div" className="relative text-left">
            <h2 className="mb-2 block text-lg leading-5 font-medium text-gray-700">
              Proposal Type
            </h2>
            <Menu.Button className="my-2 inline-flex rounded-md px-3 py-1 text-md font-regular text-slate-900 bg-gray-400 bg-opacity-5 hover:bg-opacity-10 border-2">
              {proposalType}
              <FiChevronDown
                className="ml-2 -mr-1 h-6 w-5"
                aria-hidden="true"
              />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute w-56 divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-30">
                {Object.values(ProposalTypes).map(v => (
                  <Menu.Item key={v}>
                    {({ active }) => (
                      <button
                        onClick={() => setProposalType(v)}
                        className={clsx(
                          active && 'bg-purple-50',
                          'text-gray-900 group flex items-center px-2 py-2 text-md w-full',
                        )}
                      >
                        {v}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>
          {body}
        </div>
      </motion.div>
    </div>
  );
}
