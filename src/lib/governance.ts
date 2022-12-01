import { OutcomeRecord } from 'govTypes';

export enum Outcome {
  // "win" just means some position won, including denial of a proposed change
  Win = 'win',
  // the election itself failed, for example because there was no quorum
  Fail = 'fail',
}

export function outcomeMessage(outcome?: OutcomeRecord) {
  if (!outcome) {
    return '⏳ Vote Closes';
  }

  if (outcome.outcome === Outcome.Fail) {
    return `❌ ${outcome.reason}`;
  }

  if (outcome.outcome === Outcome.Win) {
    const positionKeys = Object.keys(outcome.position);
    assert(
      positionKeys.length === 1,
      'Only single position outcomes supported',
    );
    const positionKey = positionKeys[0];
    if (['noChange', 'dontUpdate'].includes(positionKey)) {
      return '❌ Change Rejected';
    }
    return '✅ Change Accepted';
  }

  return `???`;
}
