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
      color: 'bg-yellow-500 border border-yellow-100 bg-opacity-5',
    };
  }

  if (outcome.outcome === Outcome.Fail) {
    return {
      message: `❌ ${outcome.reason}`,
      color: 'bg-red-400 bg-opacity-5',
    };
  }

  if (outcome.outcome === Outcome.Win) {
    const positionKeys = Object.keys(outcome.position);

    const positionKey = positionKeys[0];
    if (['noChange', 'dontUpdate', 'dontInvoke'].includes(positionKey)) {
      return {
        message: '❌ Change Rejected',
        color: 'bg-red-400 bg-opacity-5',
      };
    }

    return {
      message: '✅ Change Accepted',
      color: 'bg-green-400 bg-opacity-10',
    };
  }

  return {
    message: `???`,
    color: 'bg-yellow-500 border border-yellow-100 bg-opacity-5',
  };
}
