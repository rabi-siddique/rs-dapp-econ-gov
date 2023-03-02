import { AssetKind } from '@agoric/ertp';
import type { Brand } from '@agoric/ertp/src/types';
import { parseAsValue, stringifyValue } from '@agoric/ui-components';
import { Ratio } from '@agoric/zoe/src/contractSupport';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { displayFunctionsAtom } from 'store/app';

export const AmountInput = ({
  value,
  onChange,
  brand,
  suffix,
}: {
  onChange: (value: bigint) => void;
  value: bigint;
  brand: Brand;
  suffix?: string;
}) => {
  const { getDecimalPlaces } = useAtomValue(displayFunctionsAtom);

  const decimalPlaces = getDecimalPlaces(brand);

  const amountString = stringifyValue(value, AssetKind.NAT, decimalPlaces, 4);
  const [fieldString, setFieldString] = useState(
    value === null ? '0' : amountString,
  );

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = ev => {
    const str = ev.target?.value?.replace(/[^0-9]+/g, '');
    setFieldString(str);
    const parsed = parseAsValue(str, AssetKind.NAT, decimalPlaces);
    onChange(parsed);
  };

  const valueString =
    value === parseAsValue(fieldString, AssetKind.NAT, decimalPlaces)
      ? fieldString
      : amountString;

  const displayString =
    valueString && new Intl.NumberFormat().format(Number(valueString));

  return (
    <div className="relative flex-grow">
      <input
        type="text"
        placeholder="0"
        value={displayString}
        onChange={handleInputChange}
        className={clsx(
          'rounded bg-white bg-opacity-100 text-xl p-3 leading-6 w-full border-gray-300 focus:border-purple-300 focus:ring-purple-300',
          suffix ? 'pr-10' : '',
        )}
      />
      {suffix && (
        <span className="z-10 h-full leading-snug font-normal text-center text-slate-400 absolute bg-transparent rounded text-base items-center justify-center w-8 right-0 pr-3 py-3">
          {suffix}
        </span>
      )}
    </div>
  );
};

// Standard denominator value to use for all percentages.
const normalDenominator = 10_000n;

export const PercentageInput = ({
  ratio,
  onChange,
  max,
}: {
  ratio: Ratio;
  onChange: (newRatio: Ratio) => void;
  max?: string;
}) => {
  assert(
    ratio.denominator.value <= normalDenominator,
    `Cannot handle denominators > ${normalDenominator}`,
  );
  const scaleFactor = normalDenominator / ratio.denominator.value;
  const normalizedRatio = {
    numerator: {
      ...ratio.numerator,
      value: ratio.numerator.value * scaleFactor,
    },
    denominator: {
      ...ratio.denominator,
      value: normalDenominator,
    },
  };

  const valueString =
    normalizedRatio.numerator.value === 0n
      ? ''
      : String(Number(normalizedRatio.numerator.value) / 100);
  const [fieldString, setFieldString] = useState(valueString);

  const parseFieldString = str => BigInt(Math.round(Number(str) * 100));

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = ev => {
    const str = ev.target?.value?.replace('-', '').replace('e', '');
    setFieldString(str);
    const { numerator, denominator } = normalizedRatio;
    const newNumerator = {
      ...numerator,
      value: parseFieldString(str),
    };
    onChange({ denominator, numerator: newNumerator });
  };

  const displayString =
    normalizedRatio.numerator.value === parseFieldString(fieldString)
      ? fieldString
      : valueString;

  return (
    <div className="relative flex w-full flex-wrap items-stretch">
      <input
        placeholder="0.00"
        type="number"
        step="0.01"
        value={displayString}
        onChange={handleInputChange}
        className="rounded bg-white bg-opacity-100 text-xl p-3 pr-10 leading-6 w-full border-gray-300 focus:border-purple-300 focus:ring-purple-300"
        min="0"
        max={max}
      />
      <span className="z-10 h-full leading-snug font-normal text-center text-slate-400 absolute bg-transparent rounded text-base items-center justify-center w-8 right-0 pr-3 py-3">
        %
      </span>
    </div>
  );
};
