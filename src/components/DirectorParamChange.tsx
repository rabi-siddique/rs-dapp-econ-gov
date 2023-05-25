import type { Amount } from '@agoric/ertp/src/types';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { LoadStatus, usePublishedDatum, WalletContext } from 'lib/wallet';
import { useContext, useState } from 'react';
import { AmountInput, PercentageInput } from './inputs';
import { SubmitInput } from './SubmitButton';
import { displayParamName } from 'utils/displayFunctions';

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
    }
  | {
      type: 'string';
      value: string;
    };

type GovernedParams = { current: Record<string, ParameterValue> };

interface Props {
  charterOfferId: string;
}

export default function DirectorParamChange(props: Props) {
  const walletUtils = useContext(WalletContext);

  const { data, status } = usePublishedDatum(`vaultFactory.governance`) as {
    data: GovernedParams;
    status: LoadStatus;
  };
  const [minutesUntilClose, setMinutesUntilClose] = useState(10);

  const [paramPatch, setParamPatch] = useState({});

  console.log('ProposeParamChange', { data, paramPatch });

  const canMakeProposal = !!props.charterOfferId;

  function displayParam(name: string, { type, value }: ParameterValue) {
    console.log('display param', name, value, type);
    const arg = paramPatch[name] || value;

    switch (type) {
      case 'amount':
        return (
          <AmountInput
            suffix={name === 'MinInitialDebt' ? 'IST' : null}
            value={arg.value}
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
            ratio={arg}
            onChange={newRatio =>
              setParamPatch({
                ...paramPatch,
                [name]: newRatio,
              })
            }
          />
        );
      case 'string':
        return (
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Not set"
              value={arg}
              onChange={ev =>
                setParamPatch({
                  ...paramPatch,
                  [name]: ev.target.value,
                })
              }
              className={clsx(
                'rounded bg-white bg-opacity-100 text-xl p-3 leading-6 w-full border-gray-300 focus:border-purple-300 focus:ring-purple-300',
              )}
            />
          </div>
        );
      default:
        return <i className="text-gray-500">{type} not supported</i>;
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    console.debug({ event });
    const offer = walletUtils.makeVoteOnVaultDirectorParams(
      props.charterOfferId,
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
                <span className="text-gray-700">{displayParamName(name)}</span>
                <div className="w-full">{displayParam(name, value)}</div>
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
            <SubmitInput
              value="Propose Parameter Change"
              canSubmit={canMakeProposal}
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
      <h2 className="mb-2 block text-lg leading-5 font-medium text-gray-700">
        Parameters
      </h2>
      {content}
    </div>
  );
}
