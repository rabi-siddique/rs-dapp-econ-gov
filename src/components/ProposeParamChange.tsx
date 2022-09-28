import { Amount } from '@agoric/ertp';
import { useAtomValue } from 'jotai';
import { usePublishedDatum, WalletContext } from 'lib/wallet';
import { useContext, useState } from 'react';
import { displayFunctionsAtom, governedParamsIndexAtom } from 'store/app';
import { AmountInput, PercentageInput } from './inputs';

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

export default function ProposeParamChange(props: Props) {
  const governedParamsIndex = useAtomValue(governedParamsIndexAtom);
  const walletUtils = useContext(WalletContext);
  const { status, data } = usePublishedDatum(
    `psm.IST.${props.anchorName}.governance`
  );
  const [minutesUntilClose, setMinutesUntilClose] = useState(10);
  const { displayAmount, displayPercent, displayRatio } =
    useAtomValue(displayFunctionsAtom);

  const [paramPatch, setParamPatch] = useState({});

  console.log('ProposeParamChange', { data, paramPatch });

  const params = governedParamsIndex.get(props.anchorName);
  if (!params) {
    return <b>signal wallet!</b>;
  }
  function displayParam(name: string, { type, value }: ParameterValue) {
    switch (type) {
      case 'amount':
        return (
          <AmountInput
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
        return <i>{type} not supported</i>;
    }
  }

  function handleSubmit(event) {
    console.log({ event });
    const offer = walletUtils.makeVoteOnParamChange(
      props.anchorName,
      paramPatch,
      minutesUntilClose
    );
    walletUtils.sendOffer(offer);
    event.preventDefault();
  }

  if (!data?.current) {
    return <b>loading… (you have to signal wallet)</b>;
  }

  // styling examples https://tailwindcss-forms.vercel.app/
  return (
    <div className="block mt-16">
      <h2>VoteOnParamChange</h2>
      <form onSubmit={handleSubmit}>
        {Object.entries(data.current).map(([name, value]) => (
          <label className="block" key={name}>
            <span className="text-gray-700">{name}</span>
            <div className="form-input mt-1 block w-full">
              {displayParam(name, value as ParameterValue)}
            </div>
          </label>
        ))}

        <label className="block">
          <span className="text-gray-700">Minutes until close of vote</span>
          <input
            type="number"
            className="mt-1 block w-full"
            value={minutesUntilClose}
            onChange={e => setMinutesUntilClose(e.target.valueAsNumber)}
          />
        </label>

        <input
          type="submit"
          value="Propose param change"
          className="btn-primary p-1 rounded mt-2"
        />
      </form>
    </div>
  );
}
