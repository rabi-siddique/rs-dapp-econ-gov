/**
 * @file types adapted from '@agoric/governance/src/types.js'
 *
 * XXX much/most of this is copied and could get out of sync.
 * TODO: import them https://github.com/Agoric/agoric-sdk/issues/6343
 */
import { Amount, Brand } from '@agoric/ertp';
import { Ratio } from '@agoric/zoe/src/contractSupport';

// Endo with boardId marshaling
export type RpcRemote = { boardId: string; iface?: string };

// Zoe
type Timer = RpcRemote;
type Instance = RpcRemote;
type Handle<H extends string> = H & Record<string, never>;

// '@agoric/governance/src/types.js'
/** This Dapp supports a subset of the full ElectionType. */
type SupportedElectionType = 'param_change' | 'offer_filter';
type QuorumRule = 'majority' | 'all' | 'no_quorum';
type ChoiceMethod = 'unranked' | 'order';
type Timestamp = bigint;
type ClosingRule = {
  timer: Timer;
  deadline: Timestamp;
};

type SupportedParamValue = Amount | Ratio;
export type ChangeParamsPosition = Record<string, SupportedParamValue>;
type NoChangeParamsPosition = { noChange: string[] };
type ParamChangePositions = {
  positive: ChangeParamsPosition;
  negative: NoChangeParamsPosition;
};
export type ParamChangesSpec<P = StandardParamPath> = {
  paramPath: P;
  changes: Record<string, SupportedParamValue>;
};
type StandardParamPath = { key: string };
type ParamChangeIssue<P = StandardParamPath> = {
  spec: ParamChangesSpec<P>;
  contract: Instance;
};

type OfferFilterPosition = { strings: string[] };
type NoChangeOfferFilterPosition = { dontUpdate: string[] };
type OfferFilterIssue = { strings: string[] };

export type ParamChangeSpec = {
  electionType: 'param_change';
  issue: ParamChangeIssue;
  positions: ParamChangePositions;
  tieOutcome: ChangeParamsPosition;
};
export type OfferFilterSpec = {
  electionType: 'offer_filter';
  issue: OfferFilterIssue;
  positions: (OfferFilterPosition | NoChangeOfferFilterPosition)[];
  tieOutcome: OfferFilterPosition | NoChangeOfferFilterPosition;
};
type QuestionSpec = (ParamChangeSpec | OfferFilterSpec) & {
  method: ChoiceMethod;
  maxChoices: number;
  closingRule: ClosingRule;
  quorumRule: QuorumRule;
};

export type QuestionDetails = QuestionSpec & {
  counterInstance: Instance; // instance of the VoteCounter
  questionHandle: Handle<'Question'>;
};

export type OutcomeRecord<
  ET extends SupportedElectionType = SupportedElectionType
> = {
  question: Handle<'Question'>;
} & (
  | {
      outcome: 'win';
      position: ET extends 'param_change'
        ? ChangeParamsPosition
        : OfferFilterPosition;
    }
  | { outcome: 'fail'; reason: 'No quorum' }
);
