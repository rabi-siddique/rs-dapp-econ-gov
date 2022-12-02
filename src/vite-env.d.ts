/// <reference types="vite/client" />

declare module '@agoric/wallet-backend' {
  export type PursesJSONState = {
    brand: Brand;
    /** The board ID for this purse's brand */
    brandBoardId: string;
    /** The board ID for the deposit-only facet of this purse */
    depositBoardId?: string;
    /** The petname for this purse's brand */
    brandPetname: Petname;
    /** The petname for this purse */
    pursePetname: Petname;
    /** The brand's displayInfo */
    displayInfo: any;
    /** The purse's current balance */
    value: any;
    currentAmountSlots: any;
    currentAmount: any;
  };
}

declare module '@agoric/ui-components' {
  export const parseAsValue;
  export const stringifyValue;
  export const stringifyRatioAsPercent;
  export const stringifyRatio;
}

declare module '@agoric/zoe/src/contractSupport' {
  export type Ratio = {
    numerator: Amount;
    denominator: Amount;
  };
  export const makeRatioFromAmounts;
  export const floorMultiplyBy;
  export const oneMinus;
  export const floorDivideBy;
}
