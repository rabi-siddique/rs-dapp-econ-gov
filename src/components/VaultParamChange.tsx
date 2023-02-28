import type { Amount } from '@agoric/ertp/src/types';
import { Fragment } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import clsx from 'clsx';
import { Menu, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import {
  LoadStatus,
  usePublishedDatum,
  usePublishedKeys,
  WalletContext,
} from 'lib/wallet';
import { useContext, useState } from 'react';
import { AmountInput, PercentageInput } from './inputs';

interface Props {
  charterOfferId: number;
}

export type ParameterValue =
  | {
      type: 'invitation';
      value: Amount<'set'>;
    }
  | {
      type: 'ratio';
      value: { numerator: Amount<'nat'>; denominator: Amount<'nat'> };
    }
  | {
      type: 'amount';
      value: Amount;
    };

export default function VaultParamChange(props: Props) {
  const walletUtils = useContext(WalletContext);
  const { data: vaultKeys, status: vaultKeysStatus } =
    usePublishedKeys('vaultFactory');

  const managerIds = vaultKeys.filter(key => key.startsWith('manager'));
  const [managerId, setManagerId] = useState(null);

  const { data, status } = usePublishedDatum(
    `vaultFactory.${managerId}.governance`,
  );

  const { data: selectedManagerMetrics } = usePublishedDatum(
    `vaultFactory.${managerId}.metrics`,
  );

  const collateralBrand = selectedManagerMetrics?.totalCollateral?.brand;

  // "Alleged: IbcATOM brand" -> "IbcATOM"
  const collateralBrandLabel = collateralBrand?.iface?.split(' ')[1];

  const [minutesUntilClose, setMinutesUntilClose] = useState(10);

  const [paramPatch, setParamPatch] = useState({});

  console.log('ProposeParamChange', { data, paramPatch });

  const canMakeProposal = !!props.charterOfferId && collateralBrand;

  function displayParam(name: string, { type, value }: ParameterValue) {
    console.log('display param', name, value, type);
    switch (type) {
      case 'amount':
        return (
          <AmountInput
            suffix={name === 'DebtLimit' && 'IST'}
            value={(paramPatch[name] || value).value}
            brand={value.brand}
            onChange={newVal =>
              setParamPatch({
                ...paramPatch,
                [name]: { brand: value.brand, value: newVal },
              })
            }
          />
        );
      case 'ratio':
        return (
          <PercentageInput
            ratio={paramPatch[name] || value}
            onChange={newRatio =>
              setParamPatch({
                ...paramPatch,
                [name]: newRatio,
              })
            }
          />
        );
      default:
        return <i className="text-gray-500">{type} not supported</i>;
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    console.debug({ event });
    const offer = walletUtils.makeVoteOnVaultManagerParams(
      props.charterOfferId,
      collateralBrand,
      paramPatch,
      minutesUntilClose,
    );
    void walletUtils.sendOffer(offer);
  }

  const content =
    status === LoadStatus.Received ? (
      <motion.div
        className="px-1 overflow-hidden"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        transition={{ type: 'tween' }}
      >
        <form onSubmit={handleSubmit}>
          {Object.entries(data.current).map(([name, value]) => (
            <div className="mb-2" key={name}>
              <label className="block">
                <span className="text-gray-700">{name}</span>
                <div className="w-full">
                  {displayParam(name, value as ParameterValue)}
                </div>
              </label>
            </div>
          ))}
          <label className="block">
            <span className="text-gray-700">Minutes until close of vote</span>
            <input
              type="number"
              className="rounded mt-1 block w-full border-gray-300 focus:border-purple-300 focus:ring-purple-300"
              value={minutesUntilClose}
              onChange={e => setMinutesUntilClose(e.target.valueAsNumber)}
            />
          </label>
          <div className="w-full flex flex-row justify-end mt-2">
            <input
              type="submit"
              value="Propose Parameter Change"
              className={clsx(
                'btn-primary p-2 rounded mt-2',
                canMakeProposal ? 'cursor-pointer' : 'cursor-not-allowed',
              )}
              disabled={!canMakeProposal}
            />
          </div>
        </form>
      </motion.div>
    ) : (
      <div className="text-gray-500 mt-2">
        <i>Waiting for existing parameter values...</i>
      </div>
    );

  return (
    <div>
      <Menu as="div">
        <h2 className="mb-2 block text-lg leading-5 font-medium text-gray-700">
          Manager
        </h2>
        <Menu.Button
          disabled={vaultKeysStatus !== LoadStatus.Received}
          className="my-2 inline-flex rounded-md px-3 py-1 text-md font-regular text-slate-900 bg-gray-400 bg-opacity-5 hover:bg-opacity-10 border-2"
        >
          {managerId ? (
            <>
              {managerId} {collateralBrandLabel && `- ${collateralBrandLabel}`}
            </>
          ) : (
            <i>
              {vaultKeysStatus === LoadStatus.Received
                ? 'Select Manager'
                : 'Loading Managers...'}
            </i>
          )}
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
          <Menu.Items className="absolute w-56 divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-30">
            {managerIds.map(name => (
              <Menu.Item key={name}>
                {({ active }) => (
                  <button
                    onClick={() => setManagerId(name)}
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
      {managerId && (
        <>
          <h2 className="mb-2 block text-lg leading-5 font-medium text-gray-700">
            Parameters
          </h2>
          {content}
        </>
      )}
    </div>
  );
}
