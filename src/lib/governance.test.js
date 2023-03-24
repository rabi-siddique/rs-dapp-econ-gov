import { expect, test } from 'vitest';

import { outcomeMessage } from './governance';

test('outcomeMessage', () => {
  expect(outcomeMessage(undefined)).toStrictEqual({
    message: '⏳ Vote Closes',
    color: 'bg-yellow-500 border border-yellow-100 bg-opacity-5',
  });
  expect(outcomeMessage({})).toStrictEqual({
    message: '???',
    color: 'bg-yellow-500 border border-yellow-100 bg-opacity-5',
  });
  expect(
    outcomeMessage({ outcome: 'fail', reason: 'some reason' }),
  ).toStrictEqual({
    message: '❌ some reason',
    color: 'bg-red-400 bg-opacity-5',
  });
  expect(
    outcomeMessage({ outcome: 'win', position: { noChange: {} } }),
  ).toStrictEqual({
    message: '❌ Change Rejected',
    color: 'bg-red-400 bg-opacity-5',
  });
  expect(
    outcomeMessage({ outcome: 'win', position: { dontUpdate: {} } }),
  ).toStrictEqual({
    message: '❌ Change Rejected',
    color: 'bg-red-400 bg-opacity-5',
  });
  expect(
    outcomeMessage({ outcome: 'win', position: { dontInvoke: {} } }),
  ).toStrictEqual({
    message: '❌ Change Rejected',
    color: 'bg-red-400 bg-opacity-5',
  });
  expect(
    outcomeMessage({ outcome: 'win', position: { strings: [] } }),
  ).toStrictEqual({
    message: '✅ Change Accepted',
    color: 'bg-green-400 bg-opacity-10',
  });
});
