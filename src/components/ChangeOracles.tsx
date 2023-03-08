import { Menu, Transition } from '@headlessui/react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { LoadStatus, usePublishedDatum, WalletContext } from 'lib/wallet';
import {
  Fragment,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FiChevronDown, FiPlus, FiX } from 'react-icons/fi';
import { fromBech32 } from '@cosmjs/encoding';

interface ListItemProps {
  address: string;
  onRemove: () => void;
}

const ListItem = ({ address, onRemove }: ListItemProps) => {
  return (
    <div className="flex flex-row flex-wrap font-medium justify-between  text-purple-500 bg-purple-50 rounded-lg p-2">
      <span className="leading-8 max-w-full break-words">{address}</span>
      <button
        className="p-2 rounded hover:bg-purple-200"
        type="button"
        onClick={onRemove}
      >
        <FiX />
      </button>
    </div>
  );
};

export enum ChangeOraclesMode {
  Add,
  Remove,
}

const submitButtonLabels = {
  [ChangeOraclesMode.Add]: 'Propose Add Oracles',
  [ChangeOraclesMode.Remove]: 'Propose Remove Oracles',
};

const inputPlaceholders = {
  [ChangeOraclesMode.Add]:
    'Oracle address to add, i.e. something that looks like "agoric1XXXX..."',
  [ChangeOraclesMode.Remove]:
    'Oracle address to remove, i.e. something that looks like "agoric1XXXX..."',
};

interface Props {
  charterOfferId: number;
  mode: ChangeOraclesMode;
}

export default function ChangeOracles({ charterOfferId, mode }: Props) {
  const walletUtils = useContext(WalletContext);
  const addressInput = useRef(null);

  const { data: instances, status } = usePublishedDatum('agoricNames.instance');
  const priceFeeds = (
    status === LoadStatus.Received
      ? instances.filter(([name]) => name.includes('price feed'))
      : []
  ).map(([name]) => name);

  const [priceFeed, setPriceFeed] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [minutesUntilClose, setMinutesUntilClose] = useState(10);

  const inputError = useMemo(() => {
    if (!currentInput) {
      return '';
    }

    if (addresses.find(a => a === currentInput)) {
      return 'Already added';
    }
    try {
      const { prefix } = fromBech32(currentInput);
      return prefix === 'agoric' ? '' : 'Invalid address';
    } catch (e) {
      return 'Invalid address';
    }
  }, [addresses, currentInput]);

  const removeAddress = useCallback(
    address => {
      setAddresses(addresses.filter(a => a !== address));
    },
    [addresses],
  );

  const addAddress = useCallback(() => {
    setAddresses([...addresses, currentInput]);
    setCurrentInput('');
    addressInput.current.focus();
  }, [addresses, currentInput]);

  const canMakeProposal = !!charterOfferId && addresses.length > 0;

  function handleSubmit(event) {
    event.preventDefault();
    console.debug({ event, addresses, minutesUntilClose });

    const offerFns = {
      [ChangeOraclesMode.Add]: walletUtils.makeVoteOnAddOracles,
      [ChangeOraclesMode.Remove]: walletUtils.makeVoteOnRemoveOracles,
    };

    const offer = offerFns[mode](
      charterOfferId,
      priceFeed,
      addresses,
      minutesUntilClose,
    );
    void walletUtils.sendOffer(offer);
  }

  const addressesList = (
    <ul>
      <AnimatePresence>
        {addresses.map(address => (
          <motion.li
            className="overflow-hidden"
            key={address}
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 8 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            transition={{ type: 'tween', duration: 0.25 }}
          >
            <ListItem
              address={address}
              onRemove={() => removeAddress(address)}
            />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );

  const submitButtonLabel = submitButtonLabels[mode];
  const inputPlaceholder = inputPlaceholders[mode];

  const content = priceFeed && (
    <motion.div
      className="overflow-hidden px-1"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      transition={{ type: 'tween' }}
    >
      <h2 className="my-2 block text-lg leading-5 font-medium text-gray-700">
        Operator Addresses{' '}
        {addresses.length === 0 ? '' : `(${addresses.length})`}
      </h2>
      <div className="mt-4">{addressesList}</div>
      <div className="p-2 rounded flex flex-row gap-2 border border-gray-300 focus-within:border-purple-300 focus-within:ring-purple-300 focus-within:ring-1">
        <input
          type="text"
          ref={addressInput}
          className="p-0 grow border-none focus:ring-transparent"
          value={currentInput}
          placeholder={inputPlaceholder}
          onChange={e => setCurrentInput(e.target.value.trim())}
        />
        <button
          type="button"
          onClick={addAddress}
          className={clsx(
            ' bg-purple-50 rounded px-2 py-1 flex flex-row items-center gap-1',
            !currentInput || !!inputError
              ? 'cursor-not-allowed bg-slate-100 text-slate-400'
              : 'cursor-pointer text-purple-500 bg-purple-50 hover:bg-purple-100 focus:bg-purple-100',
          )}
          disabled={!currentInput || !!inputError}
        >
          <FiPlus />
          Add
        </button>
      </div>
      <AnimatePresence>
        {inputError && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="text-error overflow-hidden"
          >
            {inputError}
          </motion.div>
        )}
      </AnimatePresence>
      <label className="block mt-2">
        <span className="text-gray-700">Minutes until close of vote</span>
        <input
          type="number"
          className="rounded mt-1 block w-full border-gray-300 focus:border-purple-300 focus:ring-purple-300"
          value={minutesUntilClose}
          onChange={e => setMinutesUntilClose(e.target.valueAsNumber)}
        />
      </label>
      <div className="w-full flex flex-row justify-end mt-2">
        <button
          className={clsx(
            'btn-primary px-3 py-2 rounded mt-2',
            canMakeProposal ? 'cursor-pointer' : 'cursor-not-allowed',
          )}
          disabled={!canMakeProposal}
          onClick={handleSubmit}
        >
          {submitButtonLabel}
        </button>
      </div>
    </motion.div>
  );

  return (
    <>
      <motion.div
        className="overflow-hidden px-1"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        transition={{ type: 'tween' }}
      >
        <h2 className="my-2 block text-lg leading-5 font-medium text-gray-700">
          Price Feed
        </h2>
        <Menu>
          <Menu.Button
            disabled={status !== LoadStatus.Received}
            className="my-2 inline-flex rounded-md px-3 py-1 text-md font-regular text-slate-900 bg-gray-400 bg-opacity-5 hover:bg-opacity-10 border-2"
          >
            {priceFeed ? (
              <>{priceFeed}</>
            ) : (
              <i>
                {status === LoadStatus.Received
                  ? 'Select Price Feed'
                  : 'Loading Price Feeds...'}
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
              {priceFeeds.map(name => (
                <Menu.Item key={name}>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => setPriceFeed(name)}
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
        {content}
      </motion.div>
    </>
  );
}
