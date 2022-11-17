import { stringifyValue } from '@agoric/ui-components';
import { bigintStringify } from '@agoric/wallet-backend/src/bigintStringify.js';
import { Ratio } from '@agoric/zoe/src/contractSupport';
import { RadioGroup } from '@headlessui/react';
import { formatRelative, formatISO9075 } from 'date-fns';
import { useAtomValue } from 'jotai';
import { usePublishedDatum, WalletContext } from 'lib/wallet';
import { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';
import { Amount, AssetKind } from '@agoric/ertp';
import { displayFunctionsAtom } from 'store/app';
import {
  OfferFilterSpec,
  OutcomeRecord,
  ParamChangeSpec,
  QuestionDetails as IQuestionDetails,
  RpcRemote,
} from '../govTypes.js';
import { capitalize } from 'utils/displayFunctions.js';
import clsx from 'clsx';

export function OfferId(props: { id: number }) {
  const { id } = props;

  let title = '';
  try {
    title = formatISO9075(new Date(id));
  } catch (err) {
    console.debug('not a timestamp', id, err);
  }
  return <code title={title}>{id}</code>;
}

export function Deadline(props: { seconds: bigint }) {
  const { seconds } = props;

  const date = new Date(Number(seconds) * 1000);
  const relativeDate = formatRelative(date, new Date());

  return (
    <div className="py-2 font-medium">
      Deadline - {relativeDate}{' '}
      <span className="font-normal">({formatISO9075(date)})</span>
    </div>
  );
}

/**
 * a Ratio is "safe" iff
 *   - it's dimentionless; i.e. brands cancel out
 *   - values are safe integers
 */
const isSafeRatio = (value: Amount | Ratio) => {
  if (!('numerator' in value && 'denominator' in value)) {
    return false;
  }
  const { numerator, denominator } = value;
  if (numerator.brand !== denominator.brand) {
    return false;
  }
  return (
    Number.isSafeInteger(Number(numerator.value)) &&
    Number.isSafeInteger(Number(denominator.value))
  );
};

function ParamChanges(props: { changes: Record<string, unknown> }) {
  const { getDecimalPlaces } = useAtomValue(displayFunctionsAtom);
  const { changes } = props;

  const fmtVal = (value: Amount | Ratio) => {
    if (typeof value === 'object' && 'brand' in value && 'value' in value) {
      const decimalPlaces = getDecimalPlaces(value.brand) || 6;
      const numeral = stringifyValue(
        value.value,
        AssetKind.NAT,
        decimalPlaces,
        decimalPlaces
      );
      return <>{numeral} IST</>;
    } else if (isSafeRatio(value)) {
      const { numerator, denominator } = value;
      const pct = (100 * Number(numerator.value)) / Number(denominator.value);
      return <>{pct}%</>;
    }
    // fallback
    return bigintStringify(value);
  };
  return (
    <table className="w-full text-md text-left">
      <thead className="bg-gray-100">
        <tr>
          <th scope="col" className="font-medium p-2">
            Parameter
          </th>
          <th scope="col" className="font-medium p-2">
            New Value
          </th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(changes).map(([name, value]) => (
          <tr className="border-b" key={name}>
            <td className="p-2">{name}</td>
            <td className="p-2">{fmtVal(value as Amount | Ratio)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PrettyOutcome(props: { outcome: OutcomeRecord }) {
  switch (props.outcome?.outcome) {
    case 'win':
      return <span>Passed ✅</span>;
    case 'fail':
      return <span>Failed ❌</span>;
    default:
      return <span>Pending ⏳</span>;
  }
}

function paramChangeOutcome(
  { issue }: ParamChangeSpec,
  instance?: [name: string, value: RpcRemote][]
) {
  const name =
    instance && instance.find(([_n, i]) => i === issue.contract)?.[0];
  return (
    <>
      <p className="mb-2">
        Change <span className="font-medium">{name}</span> parameters:
      </p>
      <ParamChanges changes={issue.spec.changes} />
    </>
  );
}

function offerFilterOutcome({ issue }: OfferFilterSpec) {
  return (
    <>
      Set filtered offers to <code>{bigintStringify(issue.strings)}</code>
    </>
  );
}

export function QuestionDetails(props: {
  details: IQuestionDetails;
  outcome?: OutcomeRecord;
  instance?: [property: string, value: RpcRemote][];
}) {
  const { details, outcome, instance } = props;
  console.debug('QuestionDetails', details);
  return (
    <>
      <div className="mb-2 px-2 flex align-middle justify-between">
        <Deadline seconds={details.closingRule.deadline} />
        <div className="px-4 py-2 rounded-3xl w-fit border-2 text-sm">
          <PrettyOutcome outcome={outcome} />
        </div>
      </div>
      <div className="p-2">
        {details.electionType === 'offer_filter'
          ? offerFilterOutcome(details)
          : details.electionType === 'param_change'
          ? paramChangeOutcome(details, instance)
          : '???'}
      </div>
    </>
  );
}

function ChoosePosition(props: {
  positions: string[];
  onChoose(position: string): void;
}) {
  const [position, setPosition] = useState(null);

  const handleSubmit = e => {
    props.onChoose(position);
    e.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit}>
      <RadioGroup className="px-2" value={position} onChange={setPosition}>
        <RadioGroup.Label className="block leading-5 font-medium mt-4 mb-2">
          Choose Position:
        </RadioGroup.Label>
        <div className="flex flex-row-reverse justify-end gap-2">
          {props.positions.map((pos, index) => (
            <RadioGroup.Option
              key={index}
              value={pos}
              className={({ checked }) =>
                clsx(
                  checked ? 'ring-purple-300' : 'ring-gray-200',
                  'ring-2 relative flex cursor-pointer rounded-lg px-5 py-4 focus:outline-none'
                )
              }
            >
              {({ checked }) => (
                <div className="flex h-46 w-20 items-center justify-center gap-x-2">
                  <motion.div layout="position" className="text-sm">
                    <RadioGroup.Label
                      as="p"
                      className="font-medium text-gray-900"
                    >
                      {index === 0 ? 'YES' : 'NO'}
                    </RadioGroup.Label>
                  </motion.div>
                  {checked && (
                    <motion.div
                      className="shrink-0 text-gray-900"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                    >
                      <FiCheck className="h-5 w-6" />
                    </motion.div>
                  )}
                </div>
              )}
            </RadioGroup.Option>
          ))}
        </div>
      </RadioGroup>
      <div className="mt-2 px-2 flex justify-end">
        <input
          type="submit"
          value="Submit vote"
          disabled={!position}
          className={clsx(
            'btn-primary rounded mt-2 p-2',
            position ? 'cursor-pointer' : 'cursor-not-allowed'
          )}
        />
      </div>
    </form>
  );
}

export function VoteOnLatestQuestion(props: {
  ecOfferId: number;
  instance?: [property: string, value: RpcRemote][];
}) {
  const walletUtils = useContext(WalletContext);
  const { status, data } = usePublishedDatum(
    'committees.Economic_Committee.latestQuestion'
  );

  console.debug('render VoteOnLatestQuestion', status, data);
  if (!data?.positions) {
    return <b>{capitalize(status)} for a question...</b>;
  }

  function voteFor(position) {
    console.log('voting for position', position);
    const offer = walletUtils.makeOfferToVote(
      props.ecOfferId,
      [position],
      data.questionHandle
    );
    void walletUtils.sendOffer(offer);
  }
  const {
    closingRule: { deadline },
  } = data as IQuestionDetails;
  const now = Date.now(); // WARNING: ambient, effectful
  const deadlinePassed = Number(deadline) * 1000 < now;

  return (
    <motion.div
      animate={{ scale: 1 }}
      initial={{ scale: 0.95 }}
      transition={{ type: 'spring', bounce: 0.4, stiffness: 400 }}
      className="shadow-md p-4 rounded-lg border-gray-200 border"
    >
      <QuestionDetails details={data} instance={props.instance} />
      {deadlinePassed ? (
        <em className="pl-2">Deadline passed</em>
      ) : (
        <>
          <ChoosePosition positions={data.positions} onChoose={voteFor} />
        </>
      )}
    </motion.div>
  );
}
