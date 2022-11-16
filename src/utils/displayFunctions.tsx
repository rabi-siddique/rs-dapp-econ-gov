import {
  stringifyRatioAsPercent,
  stringifyRatio,
  stringifyValue,
} from '@agoric/ui-components';
import { AssetKind, Brand } from '@agoric/ertp';
import { IST_ICON } from 'assets/assets';
import type { BrandInfo } from 'store/app';
import { wellKnownBrands } from 'config';

import { Id as ToastId, toast } from 'react-toastify';
import { DeliverTxResponse } from '@cosmjs/stargate';

export const notifySigning = () =>
  toast.loading(<p>Awaiting sign and broadcast…</p>);

export const notifySuccess = (toastId: ToastId, tx: DeliverTxResponse) => {
  const txUrl = `https://bigdipper.live/agoric/transactions/${tx.transactionHash}`;
  toast.update(toastId, {
    render: (
      <p>
        <a href={txUrl} target={tx.transactionHash}>
          Transaction
        </a>{' '}
        complete.
      </p>
    ),
    type: toast.TYPE.SUCCESS,
    isLoading: false,
  });
};

export const notifyError = (toastId: ToastId, err: Error) => {
  console.log(err);
  toast.update(toastId, {
    render: err.message,
    type: toast.TYPE.ERROR,
    isLoading: false,
  });
};

const getLogoForBrandPetname = (brandPetname: string) => {
  switch (brandPetname) {
    case 'IST':
      return IST_ICON;
    default:
      return IST_ICON;
  }
};

export const displayPetname = (pn: Array<string> | string) =>
  Array.isArray(pn) ? pn.join('.') : pn;

export const makeDisplayFunctions = (brandToInfo: Map<Brand, BrandInfo>) => {
  const getDecimalPlaces = (brand: Brand) => {
    // XXX for rpc brands that don't come in the purse watcher
    if ('boardId' in brand) {
      const { boardId } = brand as unknown as { boardId: string };
      const info = wellKnownBrands[boardId];
      assert(info, `unknown boardId ${boardId}`);
      return info.decimalPlaces;
    }
    brandToInfo.get(brand)?.decimalPlaces;
  };

  const getPetname = (brand?: Brand | null) =>
    (brand && brandToInfo.get(brand)?.petname) ?? '';

  const displayPercent = (ratio: any, placesToShow: number) => {
    return stringifyRatioAsPercent(ratio, getDecimalPlaces, placesToShow);
  };

  const displayBrandPetname = (brand?: Brand | null) => {
    return displayPetname(getPetname(brand));
  };

  const displayRatio = (ratio: any, placesToShow: number) => {
    return stringifyRatio(ratio, getDecimalPlaces, placesToShow);
  };

  const displayAmount = (amount: any, placesToShow: number) => {
    const decimalPlaces = getDecimalPlaces(amount.brand);
    return stringifyValue(
      amount.value,
      AssetKind.NAT,
      decimalPlaces,
      placesToShow
    );
  };

  const displayBrandIcon = (brand?: Brand | null) =>
    getLogoForBrandPetname(getPetname(brand));

  return {
    displayPercent,
    displayBrandPetname,
    displayRatio,
    displayAmount,
    getDecimalPlaces,
    displayBrandIcon,
  };
};
