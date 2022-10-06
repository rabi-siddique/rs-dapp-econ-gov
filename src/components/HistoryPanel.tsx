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

  // Return early if not all data yet available
  const dataLoaded = [instanceStatus, qStatus, aStatus].every(
    s => s === 'received'
  );
  if (!dataLoaded) {
    return <em>stand by for question details...</em>;
  }

  const outcomeByHandle = new Map(
    outcomes.map((o: OutcomeRecord) => [o.question, o])
  );
  const questionsWithAnswers: [q: IQuestionDetails, a: OutcomeRecord][] =
    questions.map((q: IQuestionDetails) => [
      q,
      outcomeByHandle.get(q.questionHandle),
    ]);
  const receivedItems = questionsWithAnswers.map(([qData, aData], index) => (
    <div key={index} className="p-4 rounded">
      <QuestionDetails
        details={qData}
        outcome={aData?.question === qData.questionHandle ? aData : undefined}
        instance={instance}
      />
    </div>
  ));

  return (
    <div
      className={clsx(
        'rounded-xl bg-white p-3',
        'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
      )}
    >
      <div className="grid grid-cols-1 divide-y divide-blue-400">
        {receivedItems}
      </div>
    </div>
  );
}
