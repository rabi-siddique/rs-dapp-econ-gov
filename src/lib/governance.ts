import type { OutcomeRecord } from '@agoric/governance/src/types';

export enum Outcome {
  // "win" just means some position won, including denial of a proposed change
  Win = 'win',
  // the election itself failed, for example because there was no quorum
  Fail = 'fail',
}

export function outcomeMessage(outcome?: OutcomeRecord) {
  if (!outcome) {
    return {
      message: '⏳ Vote Closes',
      color: 'bg-pending',
    };
  }

  if (outcome.outcome === Outcome.Fail) {
    return {
      message: `❌ ${outcome.reason}`,
      color: 'bg-failed',
    };
  }

  if (outcome.outcome === Outcome.Win) {
    const positionKeys = Object.keys(outcome.position);

    const positionKey = positionKeys[0];
    if (['noChange', 'dontUpdate', 'dontInvoke'].includes(positionKey)) {
      return {
        message: '❌ Change Rejected',
        color: 'bg-failed',
      };
    }

    return {
      message: '✅ Change Accepted',
      color: 'bg-succeeded',
    };
  }

  return {
    message: `???`,
    color: 'bg-pending',
  };
}
