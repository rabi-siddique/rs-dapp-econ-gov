import { motion } from 'framer-motion';
import {
  LoadStatus,
  usePublishedDatum,
  usePublishedKeys,
  WalletContext,
} from 'lib/wallet';
import { useContext, useEffect, useState } from 'react';
import { SubmitInput } from './SubmitButton';

interface ManagerGroupProps {
  managerId: string;
  onChecked: (checked: Record<string, boolean>) => void;
}

const offerFilter = (managerId: string, invitationMaker: string) =>
  `${managerId}: ${invitationMaker}`;

const ManagerGroup = ({ managerId, onChecked }: ManagerGroupProps) => {
  const [checked, setChecked] = useState({
    [offerFilter(managerId, 'MakeVault')]: false,
    [offerFilter(managerId, 'AdjustBalances')]: false,
    [offerFilter(managerId, 'CloseVault')]: false,
    [offerFilter(managerId, 'TransferVault')]: false,
  });

  useEffect(() => {
    onChecked(checked);
  }, [onChecked, checked]);

  const { data: selectedManagerMetrics } = usePublishedDatum(
    `vaultFactory.managers.${managerId}.metrics`,
  );

  const collateralBrand = selectedManagerMetrics?.totalCollateral?.brand;

  // "Alleged: IbcATOM brand" -> "IbcATOM"
  const collateralBrandLabel = collateralBrand
    ?.toString()
    ?.split(' ')
    ?.slice(-2, -1)[0];

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
            <span className="ml-2">Pause {str.split(' ')[1]}</span>
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
  const { data: managerIds, status: vaultKeysStatus } = usePublishedKeys(
    'vaultFactory.managers',
  );

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
            <SubmitInput
              value="Propose Pause Offers"
              canSubmit={canMakeProposal}
            />
          </div>
        </form>
      </motion.div>
    </>
  );
}
