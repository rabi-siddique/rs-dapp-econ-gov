import { motion } from 'framer-motion';
import {
  OutcomeRecord,
  QuestionDetails as IQuestionDetails,
} from 'govTypes.js';
import { usePublishedDatum, usePublishedHistory } from 'lib/wallet.js';
import { QuestionDetails } from './questions.js';

interface Props {}

const tabContentVariant = {
  active: {
    display: 'block',
    transition: {
      staggerChildren: 0.1,
    },
  },
  inactive: {
    display: 'none',
  },
};

const cardVariant = {
  active: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
    },
  },
  inactive: {
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.25,
    },
  },
};

export default function VotePanel(_props: Props) {
  const { status: instanceStatus, data: instance } = usePublishedDatum(
    'agoricNames.instance'
  );
  const { status: qStatus, data: questions } = usePublishedHistory(
    'committees.Economic_Committee.latestQuestion'
  );
  const { status: aStatus, data: outcomes } = usePublishedHistory(
    'committees.Economic_Committee.latestOutcome'
  );

  // Return early if not all data yet available
  const dataLoaded = [instanceStatus, qStatus, aStatus].every(
    s => s === 'received'
  );
  if (!dataLoaded) {
    return <em>Stand by for question details...</em>;
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
    <motion.div
      key={index}
      variants={cardVariant}
      className="p-4 rounded-lg border-gray border shadow-md mb-4"
    >
      <QuestionDetails
        details={qData}
        outcome={aData?.question === qData.questionHandle ? aData : undefined}
        instance={instance}
      />
    </motion.div>
  ));

  return (
    <motion.div
      animate="active"
      initial="inactive"
      variants={tabContentVariant}
      className="pt-2"
    >
      {receivedItems}
    </motion.div>
  );
}
