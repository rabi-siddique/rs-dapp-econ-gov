import type { Amount, Brand, DisplayInfo } from '@agoric/ertp/src/types';
import type { Ratio } from '@agoric/zoe/src/contractSupport';
import { atom } from 'jotai';
import { makeDisplayFunctions } from 'utils/displayFunctions';
import { mapAtom } from 'utils/helpers';

export type BrandInfo = DisplayInfo<'nat'> & {
  petname: string;
};

// XXX never filled so all the display functions are generic
const brandToInfoAtom = mapAtom<Brand, BrandInfo>();

export type Metrics = {
  anchorPoolBalance: Amount;
  feePoolBalance: Amount;
  totalAnchorProvided: Amount;
  totalStableProvided: Amount;
};

export type GovernedParams = {
  GiveMintedFee: { type: 'ratio'; value: Ratio };
  MintLimit: { type: 'amount'; value: Amount };
  WantMintedFee: { type: 'ratio'; value: Ratio };
};

export const displayFunctionsAtom = atom(get => {
  const brandToInfo = get(brandToInfoAtom);
  return makeDisplayFunctions(brandToInfo);
});

/**  Experimental feature flag. */
export const previewEnabledAtom = atom(_get => false);
