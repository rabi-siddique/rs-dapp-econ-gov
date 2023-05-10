import { AssetKind } from '@agoric/ertp';
import { stringifyValue } from '@agoric/ui-components';
import { AnimatePresence, motion } from 'framer-motion';
import { useAtomValue } from 'jotai';
import { LoadStatus, usePublishedDatum, WalletContext } from 'lib/wallet';
import { useContext, useMemo, useState } from 'react';
import { displayFunctionsAtom } from 'store/app';
import { AmountInput } from './inputs';
import { SubmitButton } from './SubmitButton';

interface Props {
  charterOfferId: string;
}

export default function BurnIst({ charterOfferId }: Props) {
  const walletUtils = useContext(WalletContext);
  const { getDecimalPlaces } = useAtomValue(displayFunctionsAtom);

  const { data, status } = usePublishedDatum('reserve.metrics');
  const isLoading = status !== LoadStatus.Received;
  const brand = data?.shortfallBalance?.brand;
  const availableToBurn = data?.allocations?.Fee?.value ?? 0n;

  const formattedAvailableToBurn =
    brand &&
    new Intl.NumberFormat().format(
      Number(
        stringifyValue(
          availableToBurn,
          AssetKind.NAT,
          getDecimalPlaces(brand),
          0,
        ),
      ),
    );

  const toBurnLabel = formattedAvailableToBurn
    ? `IST to burn (${formattedAvailableToBurn} available in reserve)`
    : 'Loading reserve balance...';

  const [currentInput, setCurrentInput] = useState(null);

  const [minutesUntilClose, setMinutesUntilClose] = useState(10);

  const inputError = useMemo(() => {
    if (currentInput > availableToBurn) {
      return 'Not enough IST in reserve';
    }
    return '';
  }, [currentInput, availableToBurn]);

  const canMakeProposal = charterOfferId && currentInput && !inputError;

  function handleSubmit(event) {
    event.preventDefault();
    console.debug({ event, currentInput, minutesUntilClose });

    const offer = walletUtils.poseBurnIst(
      charterOfferId,
      { brand, value: currentInput },
      minutesUntilClose,
    );
    void walletUtils.sendOffer(offer);
  }

  return (
    <motion.div
      className="overflow-hidden px-1"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      transition={{ type: 'tween' }}
    >
      <h2 className="my-2 block text-lg leading-5 font-medium text-gray-700">
        Manual IST Burn
      </h2>
      <p className="my-1">{toBurnLabel}</p>
      <AmountInput
        disabled={isLoading}
        value={currentInput}
        brand={data?.shortfallBalance?.brand}
        suffix="IST"
        onChange={setCurrentInput}
      />
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
        <SubmitButton
          canSubmit={canMakeProposal}
          handleSubmit={handleSubmit}
          text="Propose Burn"
        />
      </div>
    </motion.div>
  );
}
