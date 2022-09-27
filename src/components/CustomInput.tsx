import { AssetKind, Brand } from '@agoric/ertp';
import { parseAsValue, stringifyValue } from '@agoric/ui-components';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { displayFunctionsAtom } from 'store/app';

const CustomInput = ({
  value,
  onChange,
  brand,
}: {
  onChange: (value: bigint) => void;
  value?: bigint;
  brand?: Brand | null;
}) => {
  const { getDecimalPlaces } = useAtomValue(displayFunctionsAtom);

  // XXX defaulting to six when no brand info
  const decimalPlaces = (brand && getDecimalPlaces(brand)) || 6;

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

export default CustomInput;
