import { Fragment } from 'react';
import clsx from 'clsx';
import { Menu, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import {
  inferInvitationStatus,
  psmCharterInvitationSpec,
  usePublishedDatum,
  WalletContext,
} from 'lib/wallet';
import { useContext, useState } from 'react';
import { HiArrowNarrowDown } from 'react-icons/hi';
import { FiChevronDown } from 'react-icons/fi';
import AcceptInvitation from './AcceptInvitation';
import ProposeParamChange from './ProposeParamChange';
import ProposePauseOffers from './ProposePauseOffers';
import { OfferId } from './questions.js';

// TODO fetch list from RPC
const anchors = [
  // Testing
  'AUSD',
  'ToyUSD',
  // Mainnet
  'USDC_axl',
  'USDC_grv',
  'USDT_axl',
  'USDT_grv',
  // DAI added in proposal 17 Dec 5, 2022
  // https://bigdipper.live/agoric/proposals/17
  'DAI_axl',
  'DAI_grv',
];

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
          To govern you must first have received an invitation to the PSM
          Charter.
        </p>
      );
    case 'available':
      return (
        <div className="rounded-lg py-5 px-6 text-base mb-3 bg-yellow-100 text-yellow-700">
          To vote you will need to accept your invitation to the PSM Charter.
          <AcceptInvitation
            description={(invitation as any).description}
            // TODO validate earlier that this invitation is from this contract
            sourceContract={psmCharterInvitationSpec.instanceName}
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

const ProposalTypes = {
  paramChange: 'Parameter Change',
  pauseOffers: 'Pause Offers',
};

export default function PsmPanel() {
  const [anchorName, setAnchorName] = useState(anchors[0]);
  const [proposalType, setProposalType] = useState(ProposalTypes.paramChange);
  const walletUtils = useContext(WalletContext);
  const { data } = usePublishedDatum(
    `wallet.${walletUtils.getWalletAddress()}.current`,
  );

  const invitationStatus = inferInvitationStatus(
    data,
    psmCharterInvitationSpec.description,
  );

  const previousOfferId = invitationStatus.acceptedIn;

  const body = (() => {
    switch (proposalType) {
      case ProposalTypes.paramChange:
        return (
          <ProposeParamChange
            psmCharterOfferId={previousOfferId}
            anchorName={anchorName}
          />
        );
      case ProposalTypes.pauseOffers:
      default:
        return (
          <ProposePauseOffers
            psmCharterOfferId={previousOfferId}
            anchorName={anchorName}
          />
        );
    }
  })();

  return (
    <div>
      <motion.div layout>
        <Eligibility {...invitationStatus} />
      </motion.div>
      <motion.div layout="position" className="w-full mt-2">
        <div className="p-4 rounded-lg border border-gray-200 shadow-md">
          <Menu as="div">
            <div className="text-md leading-5 font-regular text-gray-700">
              Contract
            </div>
            <Menu.Button className="my-2 inline-flex rounded-md px-3 py-1 text-md font-regular text-slate-900 bg-gray-400 bg-opacity-5 hover:bg-opacity-10 border-2">
              {anchorName}
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
                {anchors.map(name => (
                  <Menu.Item key={name}>
                    {({ active }) => (
                      <button
                        onClick={() => setAnchorName(name)}
                        className={`${
                          active ? 'bg-purple-50' : ''
                        } text-gray-900 group flex w-full items-center px-2 py-2 text-md`}
                      >
                        {name}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>

          <Menu as="div" className="relative text-left">
            <div className="text-md leading-5 font-regular text-gray-700">
              Proposal Type
            </div>
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
        </div>
        <div className="text-xl relative text-white bg-purple-300 p-2 w-fit rounded-3xl shadow-md -my-3 z-20 m-auto">
          <HiArrowNarrowDown />
        </div>
        <div className="p-4 rounded-lg border border-gray-200 shadow-md">
          {body}
        </div>
      </motion.div>
    </div>
  );
}
