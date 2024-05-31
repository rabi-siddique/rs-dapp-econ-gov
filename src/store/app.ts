import type { Amount, Brand, DisplayInfo } from '@agoric/ertp/src/types';
import type { Ratio } from '@agoric/zoe/src/contractSupport';
import { networkConfigs } from 'config';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { makeDisplayFunctions } from 'utils/displayFunctions';
import { mapAtom } from 'utils/helpers';
import { loadNetworkConfig } from 'utils/networkConfig';

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

const networkConfigAtom = atomWithStorage(
  'agoric-network-config',
  networkConfigs.mainnet
);

export const networkConfigPAtom = atom(async get =>
  loadNetworkConfig(get(networkConfigAtom).url)
);
