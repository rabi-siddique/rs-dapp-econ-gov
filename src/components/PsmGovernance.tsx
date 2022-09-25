import { Amount } from '@agoric/ertp';
import { useAtomValue } from 'jotai';
import { WalletContext } from 'lib/wallet';
import { useContext } from 'react';
import { governedParamsIndexAtom } from 'store/app';
import ProposeChange from './ProposeChange';
import ProposePauseOffers from './ProposePauseOffers';

interface Props {
  anchorName: string;
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

export default function PsmGovernance(props: Props) {
  const governedParamsIndex = useAtomValue(governedParamsIndexAtom);
  const walletUtils = useContext(WalletContext);

  const params = governedParamsIndex.get(props.anchorName);
  if (!params) {
    return <b>signal wallet!</b>;
  }

  return (
    <div>
      <h2>{props.anchorName}</h2>
      <h3>VoteOnParamChange</h3>
      {Object.entries(params).map(([name, value]) => (
        <ProposeChange key={name} name={name} currentValue={value} />
      ))}
      <button
        onClick={() => {
          const offer = walletUtils.makeVoteOnParamChange(
            { MintLimit: { brand: 'hi', value: 100n } },
            1
          );
          console.log('offer to send', offer);
        }}
      >
        Propose param change
      </button>
      <ProposePauseOffers anchorName={props.anchorName} />
    </div>
  );
}
