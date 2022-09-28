import { bigintStringify } from '@agoric/wallet-backend/src/bigintStringify.js';
import { RadioGroup } from '@headlessui/react';
import { usePublishedDatum, WalletContext } from 'lib/wallet';
import { useContext, useState } from 'react';

import {
  QuestionDetails as IQuestionDetails,
  OfferFilterSpec,
  OutcomeRecord,
} from '../govTypes.js';

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

function FilterIssueOutcome(
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
}) {
  const { details, outcome } = props;
  console.debug('QuestionDetails', details);
  return (
    <>
      Deadline: <ZoeTime seconds={details.closingRule.deadline} />
      <br />
      <small>
        {choice('Type', 'electionType', details.electionType)}{' '}
        {choice('Quorum', 'quorumRule', details.quorumRule)}{' '}
        {choice('Method', 'method', details.method)}
      </small>
      <br />
      {details.electionType === 'offer_filter'
        ? FilterIssueOutcome(details, outcome)
        : '???'}
    </>
  );
}

export function VoteOnLatestQuestion() {
  const walletUtils = useContext(WalletContext);
  const { status, data } = usePublishedDatum(
    'committees.Initial_Economic_Committee.latestQuestion'
  );
  const [position, setPosition] = useState(null);

  console.log('render VoteOnLatestQuestion', status, data);
  if (!data?.positions) {
    return <b>{status}</b>;
  }

  function handleSubmit(event) {
    console.log('voting for position', position);
    const offer = walletUtils.makeOfferToVote([position], data.questionHandle);
    walletUtils.sendOffer(offer);
    event.preventDefault();
  }
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
          disabled={!position}
          className="btn-primary p-1 rounded mt-2"
        />
      </form>
    </>
  );
}
