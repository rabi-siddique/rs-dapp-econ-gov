import { expect, test } from 'vitest';

import { outcomeMessage } from './governance';

test('outcomeMessage', () => {
  expect(outcomeMessage(undefined)).toStrictEqual({
    message: '⏳ Vote Closes',
    color: 'bg-pending',
  });
  expect(outcomeMessage({})).toStrictEqual({
    message: '???',
    color: 'bg-pending',
  });
  expect(
    outcomeMessage({ outcome: 'fail', reason: 'some reason' }),
  ).toStrictEqual({
    message: '❌ some reason',
    color: 'bg-failed',
  });
  expect(
    outcomeMessage({ outcome: 'win', position: { noChange: {} } }),
  ).toStrictEqual({
    message: '❌ Change Rejected',
    color: 'bg-failed',
  });
  expect(
    outcomeMessage({ outcome: 'win', position: { dontUpdate: {} } }),
  ).toStrictEqual({
    message: '❌ Change Rejected',
    color: 'bg-failed',
  });
  expect(
    outcomeMessage({ outcome: 'win', position: { dontInvoke: {} } }),
  ).toStrictEqual({
    message: '❌ Change Rejected',
    color: 'bg-failed',
  });
  expect(
    outcomeMessage({ outcome: 'win', position: { strings: [] } }),
  ).toStrictEqual({
    message: '✅ Change Accepted',
    color: 'bg-succeeded',
  });
});
