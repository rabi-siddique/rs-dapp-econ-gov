/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/anchor-has-content */
import { useAtomValue } from 'jotai';
import { displayFunctionsAtom } from 'store/app';
import { ParameterValue } from './ProposeParamChange';

interface Props {
  name: string;
  currentValue: ParameterValue;
}

export default function ProposeChange(props: Props) {
  const { displayAmount } = useAtomValue(displayFunctionsAtom);
  const { currentValue, name } = props;
  let changer = <i>{currentValue.type} not supported</i>;
  switch (currentValue.type) {
    case 'amount':
      changer = (
        <div>
          <p>Current value: {displayAmount(currentValue.value, 2)}</p>
          <p>
            Proposed new value: <input type="number" />
          </p>
        </div>
      );
      break;
  }
  return (
    <fieldset>
      <legend>
        <h3>{name}</h3>
      </legend>
      {changer}
    </fieldset>
  );
}
