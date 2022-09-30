import { bigintStringify } from '@agoric/wallet-backend/src/bigintStringify.js';
import { stringifyValue } from '@agoric/ui-components';
import { Ratio } from '@agoric/zoe/src/contractSupport';
import { RadioGroup } from '@headlessui/react';
import { usePublishedDatum, WalletContext } from 'lib/wallet';
import { useContext, useState } from 'react';
import { useAtomValue } from 'jotai';

import { displayFunctionsAtom } from 'store/app';
import {
  QuestionDetails as IQuestionDetails,
  ParamChangeSpec,
  ChangeParamsPosition,
  OfferFilterSpec,
  OutcomeRecord,
  RpcRemote,
} from '../govTypes.js';
import { AssetKind, Amount } from '@agoric/ertp';

export function OfferId(props: { id: number }) {
  const { id } = props;

  let title = '';
  try {
    title = new Date(id).toISOString();
  } catch (err) {
    console.debug('not a timestamp', id, err);
  }
  return <code title={title}>{id}</code>;
}

export function ZoeTime(props: { seconds: bigint }) {
  const { seconds } = props;

  const when = new Date(Number(seconds) * 1000).toISOString();
  return <strong>{when}</strong>;
}

const choice = (label: string, _name: string, val: string) => (
  <label>
    {label} <b>{val}</b>
  </label>
);

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
      return <>{numeral}</>;
    } else if (isSafeRatio(value)) {
      const { numerator, denominator } = value;
      const pct = (100 * Number(numerator.value)) / Number(denominator.value);
      return <>{pct}%</>;
    }
    // fallback
    return bigintStringify(value);
  };
  return (
    <ul>
      {Object.entries(changes).map(([name, value]) => (
        <li key={name}>
          <strong>{name}</strong> = {fmtVal(value as Amount | Ratio)}
        </li>
      ))}
    </ul>
  );
}

function paramChangeOutcome(
  { issue }: ParamChangeSpec,
  outcome?: OutcomeRecord,
  instance?: [name: string, value: RpcRemote][]
) {
  const name =
    instance && instance.find(([_n, i]) => i === issue.contract)?.[0];
  return (
    <>
      Proposal: change {name} parameters:{' '}
      <ParamChanges changes={issue.spec.changes} />
      <br />
      {outcome ? (
        outcome.outcome === 'win' ? (
          <>
            <strong>PASS</strong>. parameter changed to{' '}
            <ParamChanges
              changes={(outcome.position as ChangeParamsPosition).changes}
            />
          </>
        ) : (
          <strong>FAIL</strong>
        )
      ) : (
        ''
      )}
    </>
  );
}

function offerFilterOutcome(
  { issue }: OfferFilterSpec,
  outcome?: OutcomeRecord
) {
  return (
    <>
      Proposal: set filtered offers to{' '}
      <code>{bigintStringify(issue.strings)}</code>
      <br />
      {outcome ? (
        outcome.outcome === 'win' ? (
          <>
            <strong>PASS</strong>. updated filters:{' '}
            {bigintStringify(outcome.position.strings)}
          </>
        ) : (
          'FAIL'
        )
      ) : (
        ''
      )}
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
      Deadline: <ZoeTime seconds={details.closingRule.deadline} />
      <br />
      <small>
        Handle <strong>{details.questionHandle.boardId} </strong>
        {choice('Type', 'electionType', details.electionType)}{' '}
        {choice('Quorum', 'quorumRule', details.quorumRule)}{' '}
        {choice('Method', 'method', details.method)}
      </small>
      <br />
      {details.electionType === 'offer_filter'
        ? offerFilterOutcome(details, outcome)
        : details.electionType === 'param_change'
        ? paramChangeOutcome(details, outcome, instance)
        : '???'}
    </>
  );
}

export function VoteOnLatestQuestion(props: { ecOfferId: number }) {
  const walletUtils = useContext(WalletContext);
  const { status, data } = usePublishedDatum(
    'committees.Initial_Economic_Committee.latestQuestion'
  );
  const [position, setPosition] = useState(null);

  console.debug('render VoteOnLatestQuestion', status, data);
  if (!data?.positions) {
    return <b>{status} for a question</b>;
  }

  function handleSubmit(event) {
    console.log('voting for position', position);
    const offer = walletUtils.makeOfferToVote(
      props.ecOfferId,
      [position],
      data.questionHandle
    );
    walletUtils.sendOffer(offer);
    event.preventDefault();
  }
  const {
    closingRule: { deadline },
  } = data as IQuestionDetails;
  const now = Date.now(); // WARNING: ambient, effectful
  const deadlinePassed = Number(deadline) * 1000 < now;

  return (
    <>
      <QuestionDetails details={data} />
      <form onSubmit={handleSubmit}>
        <RadioGroup value={position} onChange={setPosition}>
          <RadioGroup.Label className="block text-sm leading-5 font-medium text-gray-700 mt-2">
            Positions
          </RadioGroup.Label>
          <div className="space-y-2">
            {data.positions.map((pos, index) => (
              <RadioGroup.Option
                value={pos}
                key={index}
                className={({ active, checked }) =>
                  `${
                    active
                      ? 'ring-2 ring-white ring-opacity-60 ring-offset-2 ring-offset-sky-300'
                      : ''
                  }
              ${checked ? 'bg-sky-900 bg-opacity-75 text-white' : 'bg-white'}
                relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md focus:outline-none`
                }
              >
                {({ checked }) => (
                  <span className={checked ? 'bg-blue-200' : ''}>
                    {index === 0 ? 'YES: ' : ''}
                    {bigintStringify(pos)}
                  </span>
                )}
              </RadioGroup.Option>
            ))}
          </div>
        </RadioGroup>
        <input
          type="submit"
          value="Submit vote"
          disabled={!position || deadlinePassed}
          className="btn-primary p-1 rounded mt-2"
          title={deadlinePassed ? 'Deadline passed' : ''}
        />
      </form>
    </>
  );
}
