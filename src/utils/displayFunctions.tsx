import { AssetKind } from '@agoric/ertp';
import type { Brand } from '@agoric/ertp/src/types';
import {
  stringifyRatio,
  stringifyRatioAsPercent,
  stringifyValue,
} from '@agoric/ui-components';
import { DeliverTxResponse } from '@cosmjs/stargate';
import { IST_ICON } from 'assets/assets';
import { wellKnownBrands } from 'config';
import { transactionInfoUrl } from 'lib/wallet';
import { Id as ToastId, toast } from 'react-toastify';
import type { BrandInfo } from 'store/app';

export const notifySigning = () =>
  toast.loading(<p>Awaiting sign and broadcast...</p>);

export const notifySuccess = (toastId: ToastId, tx: DeliverTxResponse) => {
  const txHash = tx.transactionHash;
  toast.update(toastId, {
    render: (
      <p>
        <a
          className="no-underline hover:underline"
          href={transactionInfoUrl(txHash)}
          target={txHash}
          title={txHash}
        >
          Transaction
        </a>{' '}
        sent.
      </p>
    ),
    type: toast.TYPE.SUCCESS,
    isLoading: false,
    closeButton: true,
  });
};

export const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

export const notifyError = (toastId: ToastId, err: Error) => {
  console.log(err);
  toast.update(toastId, {
    render: err.message,
    type: toast.TYPE.ERROR,
    isLoading: false,
    closeButton: true,
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
