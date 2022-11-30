import type {
  ChangeParamsPosition,
  NoChangeOfferFilterPosition,
  OfferFilterIssue,
  OfferFilterPosition,
  ParamChangeIssue,
  ParamChangePositions,
} from '@agoric/governance/src/types';

// Endo with boardId marshaling
export type RpcRemote = { boardId: string; iface?: string };

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
