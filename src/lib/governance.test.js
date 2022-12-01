import { expect, test } from 'vitest';

import { outcomeMessage } from './governance';

test('outcomeMessage', () => {
  expect(outcomeMessage(undefined)).toBe('⏳ Vote Closes');
  expect(outcomeMessage({})).toBe('???');
  expect(outcomeMessage({ outcome: 'fail', reason: 'some reason' })).toBe(
    '❌ some reason'
  );
  expect(outcomeMessage({ outcome: 'win', position: { noChange: {} } })).toBe(
    '❌ Change Rejected'
  );
  expect(outcomeMessage({ outcome: 'win', position: { dontUpdate: {} } })).toBe(
    '❌ Change Rejected'
  );
  expect(outcomeMessage({ outcome: 'win', position: { strings: [] } })).toBe(
    '✅ Change Accepted'
  );
});
