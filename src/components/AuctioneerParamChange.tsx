import clsx from 'clsx';
import { motion } from 'framer-motion';
import { LoadStatus, usePublishedDatum, WalletContext } from 'lib/wallet';
import { useContext, useState } from 'react';
import { SubmitInput } from './SubmitButton';
import type { RelativeTime } from 'lib/wallet';

export type ParameterValue =
  | {
      type: 'relativeTime';
      value: RelativeTime;
    }
  | {
      type: 'nat';
      value: bigint;
    };

type GovernedParams = { current: Record<string, ParameterValue> };

interface Props {
  charterOfferId: number;
}

export default function AuctioneerParamChange(props: Props) {
  const walletUtils = useContext(WalletContext);

  const { data, status } = usePublishedDatum(`auction.governance`) as {
    data: GovernedParams;
    status: LoadStatus;
  };

  const [minutesUntilClose, setMinutesUntilClose] = useState(10);

  const [paramPatch, setParamPatch] = useState({});

  const timerBrand = (data?.current?.AuctionStartDelay.value as RelativeTime)
    ?.timerBrand;

  const toRel = relValue => ({ timerBrand, relValue });

  const canMakeProposal = !!props.charterOfferId;

  function displayParam(name: string, { type, value }: ParameterValue) {
    const patch = paramPatch[name];
    const arg = typeof patch !== 'undefined' ? patch : value;

    switch (type) {
      case 'relativeTime':
        return (
          <div className="relative flex-grow">
            <input
              type="number"
              placeholder="0"
              value={Number(arg.relValue) || ''}
              onChange={ev =>
                setParamPatch({
                  ...paramPatch,
                  [name]: toRel(
                    ev.target.value
                      ? BigInt(Math.abs(Number(ev.target.value)))
                      : 0n,
                  ),
                })
              }
              className={clsx(
                'rounded bg-white bg-opacity-100 text-xl p-3 leading-6 w-full border-gray-300 focus:border-purple-300 focus:ring-purple-300',
              )}
            />
            <span className="z-10 h-full leading-snug font-normal text-center text-slate-400 absolute bg-transparent rounded text-base items-center justify-center right-0 pr-3 py-3">
              Seconds
            </span>
          </div>
        );
      case 'nat':
        return (
          <div className="relative flex-grow">
            <input
              type="number"
              placeholder="0"
              value={Number(arg) || ''}
              onChange={ev => {
                setParamPatch({
                  ...paramPatch,
                  [name]: ev.target.value
                    ? BigInt(Math.abs(Number(ev.target.value)))
                    : 0n,
                });
              }}
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
    const offer = walletUtils.makeVoteOnVaultAuctioneerParams(
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
                <span className="text-gray-700">{name}</span>
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
