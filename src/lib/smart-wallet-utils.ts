/** @file copied from agoric/smart-wallet/src/utils.js until it's exported XXX */
import { iterateReverse } from '@agoric/casting';
import { observeIteration, subscribeEach } from '@agoric/notifier';

export const NO_SMART_WALLET_ERROR = 'no smart wallet';

export const makeWalletStateCoalescer = () => {
  const brands = new Map();
  const offerStatuses = new Map();
  const balances = new Map();

  let allegedInvitationBrand = undefined;

  const invitationsReceived = new Map();

  const update = updateRecord => {
    const { updated } = updateRecord;
    switch (updateRecord.updated) {
      case 'balance': {
        const { currentAmount } = updateRecord;
        // last record wins
        balances.set(currentAmount.brand, currentAmount);
        assert(allegedInvitationBrand, 'balance before invitationBrand known');
        if (currentAmount.brand === allegedInvitationBrand) {
          for (const invitation of currentAmount.value) {
            invitationsReceived.set(invitation.description, invitation);
          }
        }
        break;
      }
      case 'offerStatus': {
        const { status } = updateRecord;
        const lastStatus = offerStatuses.get(status.id);
        // merge records
        offerStatuses.set(status.id, { ...lastStatus, ...status });
        if (
          status.invitationSpec.source === 'purse' &&
          status.numWantsSatisfied === 1
        ) {
          // record acceptance of invitation
          // xxx matching only by description
          const { description } = status.invitationSpec;
          const receptionRecord = invitationsReceived.get(description);
          if (receptionRecord) {
            invitationsReceived.set(description, {
              ...receptionRecord,
              acceptedIn: status.id,
            });
          } else {
            console.error('no record of invitation in offerStatus', status);
          }
        }
        break;
      }
      case 'brand': {
        const { descriptor } = updateRecord;
        // never mutate
        assert(!brands.has(descriptor.brand));
        brands.set(descriptor.brand, descriptor);
        if (descriptor.petname === 'invitations') {
          allegedInvitationBrand = descriptor.brand;
        }
        break;
      }
      default:
        throw new Error(`unknown record updated ${updated}`);
    }
  };

  return {
    state: { brands, invitationsReceived, offerStatuses, balances },
    update,
  };
};
/** @typedef {ReturnType<typeof makeWalletStateCoalescer>['state']} CoalescedWalletState */

export const coalesceUpdates = updates => {
  const coalescer = makeWalletStateCoalescer();

  observeIteration(subscribeEach(updates), {
    updateState: updateRecord => {
      coalescer.update(updateRecord);
    },
  });
  return coalescer.state;
};

export const getFirstHeight = async follower => {
  /** @type {number=} */
  let firstHeight = undefined;
  for await (const { blockHeight } of iterateReverse(follower)) {
    // TODO: Only set firstHeight and break if the value contains all our state.
    firstHeight = blockHeight;
  }
  assert(firstHeight, NO_SMART_WALLET_ERROR);
  return firstHeight;
};

export const coalesceWalletState = async follower => {
  // values with oldest last
  const history = [];
  for await (const followerElement of iterateReverse(follower)) {
    history.push(followerElement.value);
  }

  const coalescer = makeWalletStateCoalescer();
  // update with oldest first
  for (const record of history.reverse()) {
    coalescer.update(record);
  }

  return coalescer.state;
};
