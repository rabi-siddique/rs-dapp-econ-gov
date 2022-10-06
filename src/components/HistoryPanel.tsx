import clsx from 'clsx';
import {
  OutcomeRecord,
  QuestionDetails as IQuestionDetails,
} from 'govTypes.js';
import { usePublishedDatum, usePublishedHistory } from 'lib/wallet.js';
import { QuestionDetails } from './questions.js';

interface Props {}

export default function VotePanel(_props: Props) {
  const { status: instanceStatus, data: instance } = usePublishedDatum(
    'agoricNames.instance'
  );
  const { status: qStatus, data: questions } = usePublishedHistory(
    'committees.Initial_Economic_Committee.latestQuestion'
  );
  const { status: aStatus, data: outcomes } = usePublishedHistory(
    'committees.Initial_Economic_Committee.latestOutcome'
  );
  const outcomeByHandle = new Map(
    outcomes.map((o: OutcomeRecord) => [o.question, o])
  );
  const questionsWithAnswers: [q: IQuestionDetails, a: OutcomeRecord][] =
    questions.map((q: IQuestionDetails) => [
      q,
      outcomeByHandle.get(q.questionHandle),
    ]);
  const receivedItems =
    qStatus === 'received' && instanceStatus === 'received'
      ? questionsWithAnswers.map(([qData, aData], index) => (
          <div key={index} className="p-4 rounded">
            <QuestionDetails
              details={qData}
              outcome={
                aStatus === 'received' &&
                qData.questionHandle === aData.question
                  ? aData
                  : undefined
              }
              instance={instance}
            />
          </div>
        ))
      : null;

  return (
    <div
      className={clsx(
        'rounded-xl bg-white p-3',
        'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
      )}
    >
      {receivedItems === null ? (
        <em>stand by for question details...</em>
      ) : (
        <div className="grid grid-cols-1 divide-y divide-blue-400">
          {receivedItems}
        </div>
      )}
    </div>
  );
}
