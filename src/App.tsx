import { useAtom } from 'jotai';
import { Fragment, useContext, useEffect, MouseEventHandler } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Menu, Transition } from '@headlessui/react';
import { FiChevronDown, FiExternalLink } from 'react-icons/fi';

import { INTER_LOGO } from 'assets/assets';
import {
  brandToInfoAtom,
  governedParamsIndexAtom,
  instanceIdsAtom,
  metricsIndexAtom,
  offersAtom,
  pursesAtom,
  walletAtom,
} from 'store/app';
import { watchContract, watchOffers, watchPurses } from 'utils/updates';

import GovernanceTools from 'components/GovernanceTools';
import { WalletContext } from 'lib/wallet';
import 'styles/globals.css';

const supportedNetworks = ['main', 'emerynet', 'ollinet', 'devnet', 'local'];

const Item = ({
  label,
  onClick,
}: {
  label: string;
  onClick: MouseEventHandler;
}) => {
  return (
    <div className="px-1 py-1 ">
      <Menu.Item>
        {({ active }) => (
          <button
            onClick={onClick}
            className={`${
              active ? 'bg-violet-300 text-white' : 'text-gray-900'
            } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
          >
            {label}
          </button>
        )}
      </Menu.Item>
    </div>
  );
};

const NetPicker = (props: { currentNet: string }) => {
  const items = supportedNetworks.map(config => (
    <Item
      key={config}
      onClick={() => {
        window.location.assign(
          window.location.origin + `/?agoricNet=${config}`
        );
      }}
      label={config}
    />
  ));

  return (
    <Menu as="div" className="mb-2 mr-2 relative inline-block text-left">
      <Menu.Button className="shadow-md inline-flex w-full justify-center rounded-md hover:text-purple-300 bg-blue-900/10 hover:bg-slate-100 px-4 py-2 text-md font-medium text-primary focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
        {props.currentNet}
        <FiChevronDown className="ml-2 -mr-1 h-6 w-5" aria-hidden="true" />
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
        <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-left divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          {items}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

interface Props {}

const App = (_props: Props) => {
  const [wallet] = useAtom(walletAtom);
  const walletUtils = useContext(WalletContext);
  const [_brandToInfo, mergeBrandToInfo] = useAtom(brandToInfoAtom);
  const [_purses, setPurses] = useAtom(pursesAtom);
  const [_offers, setOffers] = useAtom(offersAtom);
  const [_metrics, setMetricsIndex] = useAtom(metricsIndexAtom);
  const [_governedParams, setGovernedParamsIndex] = useAtom(
    governedParamsIndexAtom
  );
  const [_instanceIds, setInstanceIds] = useAtom(instanceIdsAtom);

  useEffect(() => {
    if (wallet === null) return;

    // TODO: More user-friendly error handling, like a toast.
    watchPurses(wallet, setPurses, mergeBrandToInfo).catch((err: Error) =>
      console.error('got watchPurses err', err)
    );
    watchOffers(wallet, setOffers).catch((err: Error) =>
      console.error('got watchOffers err', err)
    );

    watchContract(wallet, {
      setMetricsIndex,
      setGovernedParamsIndex,
      setInstanceIds,
    }).catch((err: Error) => console.error('got watchContract err', err));
  }, [
    wallet,
    mergeBrandToInfo,
    setPurses,
    setOffers,
    setMetricsIndex,
    setGovernedParamsIndex,
    setInstanceIds,
  ]);

  const address = walletUtils.getWalletAddress();
  const explorerHref =
    walletUtils.agoricNet === 'main'
      ? `https://bigdipper.live/agoric/accounts/${address}`
      : `https://${walletUtils.agoricNet}.explorer.agoric.net/agoric/account/${address}`;

  return (
    <>
      <ToastContainer
        position={'bottom-right'}
        closeOnClick={false}
        newestOnTop={true}
        autoClose={false}
      />
      <div>
        <div className="min-w-screen container p-4 mx-auto flex flex-wrap justify-between items-center">
          <img
            src={INTER_LOGO}
            className="item mb-2"
            alt="Inter Logo"
            width="200"
          />
          <div>
            <NetPicker currentNet={walletUtils.agoricNet} />
            <a
              target="block-explorer"
              href={explorerHref}
              title="Block Explorer"
              className="shadow-md no-underline inline-flex justify-center rounded-md bg-blue-900/10 px-4 py-2 text-md font-medium text-primary hover:bg-slate-100 hover:text-purple-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
            >
              {address}
              <FiExternalLink className="my-1 ml-2 -mr-1 h-4 w-5" />
            </a>
          </div>
        </div>
        <div className="min-w-screen container mx-auto flex justify-center sm:mt-8">
          <GovernanceTools walletAddress={address} />
        </div>
      </div>
    </>
  );
};

export default App;
