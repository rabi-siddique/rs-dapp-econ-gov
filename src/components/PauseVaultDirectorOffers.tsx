import clsx from 'clsx';
import { motion } from 'framer-motion';
import {
  LoadStatus,
  usePublishedDatum,
  usePublishedKeys,
  WalletContext,
} from 'lib/wallet';
import { useContext, useEffect, useState } from 'react';

interface ManagerGroupProps {
  managerId: string;
  onChecked: (checked: Record<string, boolean>) => void;
}

const ManagerGroup = ({ managerId, onChecked }: ManagerGroupProps) => {
  const [checked, setChecked] = useState({
    [`${managerId}: MakeVault`]: false,
    [`${managerId}: AdjustBalances`]: false,
    [`${managerId}: CloseVault`]: false,
    [`${managerId}: TransferVault`]: false,
  });

  useEffect(() => {
    onChecked(checked);
  }, [onChecked, checked]);

  const { data: selectedManagerMetrics } = usePublishedDatum(
    `vaultFactory.${managerId}.metrics`,
  );

  const collateralBrand = selectedManagerMetrics?.totalCollateral?.brand;

  // "Alleged: IbcATOM brand" -> "IbcATOM"
  const collateralBrandLabel = collateralBrand?.iface?.split(' ')[1];

  const handleCheckChange = event => {
    const { target } = event;
    assert(target.type === 'checkbox');
    const { name } = target;
    setChecked({ ...checked, [name]: target.checked });
  };

  return (
    <>
      <h3 className="mb-2 block text-lg leading-5 font-medium">
        {managerId}
        {collateralBrandLabel && ` - ${collateralBrandLabel}`}
      </h3>
      {Object.keys(checked).map(str => (
        <div key={str} className="ml-4 my-3 leading-5">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="cursor-pointer text-primary focus:border-primary focus:ring-primary"
              name={str}
              checked={checked[str]}
              onChange={handleCheckChange}
            />
            <span className="ml-2">{str.split(' ')[1]}</span>
          </label>
        </div>
      ))}
    </>
  );
};

interface Props {
  charterOfferId: number;
}

export default function PauseVaultDirectorOffers(props: Props) {
  const walletUtils = useContext(WalletContext);
  const { data: vaultKeys, status: vaultKeysStatus } =
    usePublishedKeys('vaultFactory');

  const managerIds = vaultKeys.filter(key => key.startsWith('manager'));

  const [checked, setChecked] = useState({});

  const [minutesUntilClose, setMinutesUntilClose] = useState(10);

  const canMakeProposal = !!props.charterOfferId;

  function handleSubmit(event) {
    event.preventDefault();
    console.debug({ event, checked, minutesUntilClose });
    const toPause = Object.entries(checked)
      .filter(([_, check]) => check)
      .map(([name]) => name);
    const offer = walletUtils.makeVoteOnPauseVaultOffers(
      props.charterOfferId,
      toPause,
      minutesUntilClose,
    );
    void walletUtils.sendOffer(offer);
  }

  const managers =
    vaultKeysStatus === LoadStatus.Received ? (
      managerIds.map(id => {
        return <ManagerGroup key={id} managerId={id} onChecked={setChecked} />;
      })
    ) : (
      <div>Loading Vault Managers...</div>
    );

  return (
    <>
      <motion.div
        className="overflow-hidden px-1"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        transition={{ type: 'tween' }}
      >
        <form onSubmit={handleSubmit}>
          <h2 className="mb-2 block text-lg leading-5 font-medium text-gray-700">
            Set Paused Offers
          </h2>
          <p className="text-warning">Current filter not displayed</p>
          <div className="block my-3">{managers}</div>
          <label className="block">
            <span className="text-gray-700">Minutes until close of vote</span>
            <input
              type="number"
              className="rounded mt-1 block w-full border-gray-300 focus:border-purple-300 focus:ring-purple-300"
              value={minutesUntilClose}
              onChange={e => setMinutesUntilClose(e.target.valueAsNumber)}
            />
          </label>
          <div className="w-full flex flex-row justify-end mt-2">
            <input
              type="submit"
              value="Propose Pause Offers"
              className={clsx(
                'btn-primary p-2 rounded mt-2',
                canMakeProposal ? 'cursor-pointer' : 'cursor-not-allowed',
              )}
              disabled={!canMakeProposal}
            />
          </div>
        </form>
      </motion.div>
    </>
  );
}
