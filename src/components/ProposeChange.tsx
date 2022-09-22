/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/anchor-has-content */
import clsx from 'clsx';

interface Props {
  paramName: string;
}

export default function GovernanceTools(props: Props) {
  return (
    <fieldset>
      <legend>PROPOSE CHANGE: {props.paramName}</legend>
      Current value: ??? Proposed new value: <input type="number" />
      <button>Submit proposal</button>
    </fieldset>
  );
}
