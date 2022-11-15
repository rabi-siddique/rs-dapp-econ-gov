/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/anchor-has-content */
import { Tab } from '@headlessui/react';
import clsx from 'clsx';
import { usePublishedDatum } from 'lib/wallet';
import HistoryPanel from './HistoryPanel';
import PsmPanel from './PsmPanel';
import VotePanel from './VotePanel';

interface Props {
  walletAddress: string;
}

export default function GovernanceTools(props: Props) {
  const { status, data } = usePublishedDatum(
    `wallet.${props.walletAddress}.current`
  );

  const tabClassname = ({ selected }) =>
    clsx(
      'w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700',
      'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
      selected
        ? 'bg-white shadow'
        : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
    );

  console.debug('render GovernanceTools', { status, data });
  if (status === 'idle') {
    return (
      <p>
        No smart wallet found. Try <em>Signal Wallet</em>
      </p>
    );
  }

  return (
    <div className="w-full max-w-4xl px-2 pb-16 sm:px-0">
      <Tab.Group defaultIndex={0}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          <Tab key="history" className={tabClassname}>
            History
          </Tab>
          <Tab key="vote" className={tabClassname}>
            Vote
          </Tab>
          <Tab key="propose" className={tabClassname}>
            Propose Change
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-2">
          <Tab.Panel key="history">
            <HistoryPanel />
          </Tab.Panel>
          <Tab.Panel key="vote">
            <VotePanel />
          </Tab.Panel>
          <Tab.Panel key="propose">
            <PsmPanel />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
