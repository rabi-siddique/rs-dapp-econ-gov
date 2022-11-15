import { AssetKind, Brand } from '@agoric/ertp';
import { parseAsValue, stringifyValue } from '@agoric/ui-components';
import { Ratio } from '@agoric/zoe/src/contractSupport';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { displayFunctionsAtom } from 'store/app';

export const AmountInput = ({
  value,
  onChange,
  brand,
}: {
  onChange: (value: bigint) => void;
  value: bigint;
  brand: Brand;
}) => {
  const { getDecimalPlaces } = useAtomValue(displayFunctionsAtom);

  const decimalPlaces = getDecimalPlaces(brand);

  const amountString = stringifyValue(value, AssetKind.NAT, decimalPlaces, 4);
  const [fieldString, setFieldString] = useState(
    value === null ? '0' : amountString
  );

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = ev => {
    const str = ev.target?.value?.replace('-', '').replace('e', '');
    setFieldString(str);
    const parsed = parseAsValue(str, AssetKind.NAT, decimalPlaces);
    onChange(parsed);
  };

  const displayString =
    value === parseAsValue(fieldString, AssetKind.NAT, decimalPlaces)
      ? fieldString
      : amountString;

  return (
    <div className="relative flex-grow">
      <input
        type="number"
        placeholder="0.0"
        value={displayString}
        onChange={handleInputChange}
        className="rounded-sm bg-white bg-opacity-100 text-xl p-3 leading-6 w-full hover:outline-none focus:outline-none border-none"
        min="0"
      />
    </div>
  );
};

export const PercentageInput = ({
  ratio,
  onChange,
}: {
  ratio: Ratio;
  onChange: (newRatio: Ratio) => void;
}) => {
  assert(
    ratio.denominator.value === 10_000n,
    'only conventional denominator value supported'
  );
  const value = Number(ratio.numerator.value) / 100;
  const valueString = value ? String(value) : '';
  const [fieldString, setFieldString] = useState(valueString);

  const parseFieldString = str => BigInt(Math.round(Number(str) * 100));

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = ev => {
    const str = ev.target?.value?.replace('-', '').replace('e', '');
    setFieldString(str);
    const { numerator, denominator } = ratio;
    const newNumerator = {
      ...numerator,
      value: parseFieldString(str),
    };
    onChange({ denominator, numerator: newNumerator });
  };

  const displayString =
    ratio.numerator.value === parseFieldString(fieldString)
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
        className="rounded-sm bg-white bg-opacity-100 text-xl p-3 pr-10 leading-6 w-full hover:outline-none focus:outline-none border-none"
        min="0"
        max="100"
      />
      <span className="z-10 h-full leading-snug font-normal text-center text-slate-400 absolute bg-transparent rounded text-base items-center justify-center w-8 right-0 pr-3 py-3">
        %
      </span>
    </div>
  );
};
