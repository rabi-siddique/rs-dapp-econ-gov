import clsx from 'clsx';
import { usePublishedDatum } from 'lib/wallet.js';
import { QuestionDetails } from './questions.js';

interface Props {}

export default function VotePanel(_props: Props) {
  const { status: qStatus, data: qData } = usePublishedDatum(
    'committees.Initial_Economic_Committee.latestQuestion'
  );
  const { status: aStatus, data: aData } = usePublishedDatum(
    'committees.Initial_Economic_Committee.latestOutcome'
  );
  return (
    <div
      className={clsx(
        'rounded-xl bg-white p-3',
        'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
      )}
    >
      {qStatus === 'received' ? (
        <QuestionDetails
          details={qData}
          outcome={
            aStatus === 'received' && qData.questionHandle === aData.question
              ? aData
              : undefined
          }
        />
      ) : (
        <em>stand by for question details...</em>
      )}
    </div>
  );
}
