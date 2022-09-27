import { atom } from 'jotai';
import type { Id as ToastId, ToastOptions } from 'react-toastify';

import type { GovernedParams, Metrics } from 'store/app';
import {
  governedParamsIndexAtom,
  instanceIdsAtom,
  metricsIndexAtom,
} from 'store/app';

export enum SwapError {
  IN_PROGRESS = 'Swap in progress.',
  EMPTY_AMOUNTS = 'Please enter the amounts first.',
  NO_BRANDS = 'Please select an asset first.',
}

export enum ButtonStatus {
  SWAP = 'Swap',
  SWAPPED = 'Swapped',
  REJECTED = 'Rejected',
  DECLINED = 'Declined',
}

export const defaultToastProperties: ToastOptions = {
  position: 'bottom-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  containerId: 'Info',
};

export enum SwapDirection {
  TO_STABLE,
  TO_ANCHOR,
}

// XXX default AUSD
export const selectedAnchorPetnameAtom = atom<string | null>('AUSD');

export const anchorBrandAtom = atom(
  get => get(metricsAtom)?.anchorPoolBalance?.brand
);

export const anchorBrandsAtom = atom(get => {
  const metrics = [...get(metricsIndexAtom).entries()];
  return metrics.map(
    ([_petname, { anchorPoolBalance }]) => anchorPoolBalance.brand
  );
});

/** The metrics for the currently selected anchor. */
export const metricsAtom = atom<Metrics | null>(get => {
  const selectedPetname = get(selectedAnchorPetnameAtom);
  if (!selectedPetname) {
    return null;
  }
  return get(metricsIndexAtom).get(selectedPetname) ?? null;
});

/** The governed params for the currently selected anchor. */
export const governedParamsAtom = atom<GovernedParams | null>(get => {
  const selectedPetname = get(selectedAnchorPetnameAtom);
  if (!selectedPetname) {
    return null;
  }
  return get(governedParamsIndexAtom).get(selectedPetname) ?? null;
});

/** The contract instance id for the currently selected anchor. */
export const instanceIdAtom = atom<string | null>(get => {
  const selectedPetname = get(selectedAnchorPetnameAtom);
  if (!selectedPetname) {
    return null;
  }
  return get(instanceIdsAtom).get(selectedPetname) ?? null;
});

export const stableBrandAtom = atom(get => {
  const metrics = get(metricsIndexAtom);
  const entries = metrics && [...metrics.entries()];

  // Use the first entry, the fee token is always the same.
  const firstEntry = entries && entries.at(0);
  if (!firstEntry) {
    return null;
  }

  return firstEntry[1].feePoolBalance.brand;
});

export const toastIdAtom = atom<ToastId | null>(null);
export const currentOfferIdAtom = atom<number | null>(null);
export const swapButtonStatusAtom = atom<ButtonStatus>(ButtonStatus.SWAP);
export const swapInProgressAtom = atom<boolean>(false);

const errorsInnerAtom = atom<Set<SwapError>>(new Set<SwapError>());
export const errorsAtom = atom(get => get(errorsInnerAtom));

export const addErrorAtom = atom(null, (get, set, newError: SwapError) => {
  const errors = get(errorsInnerAtom);
  set(errorsInnerAtom, new Set(errors).add(newError));
});

export const removeErrorAtom = atom(
  null,
  (get, set, errorToRemove: SwapError) => {
    const errors = new Set(get(errorsInnerAtom));
    errors.delete(errorToRemove);
    set(errorsInnerAtom, errors);
  }
);
