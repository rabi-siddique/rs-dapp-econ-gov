import { motion } from 'framer-motion';
import { WalletContext } from 'lib/wallet';
import { useContext, useState } from 'react';
import { SubmitInput } from './SubmitButton';

interface Props {
  charterOfferId: number;
}

const invitationDescriptions = {
  newBid: 'new bid',
};

export default function PauseLiquidations(props: Props) {
  const walletUtils = useContext(WalletContext);
  // XXX read the initial state from rpc?
  const [checked, setChecked] = useState({
    [invitationDescriptions.newBid]: false,
  });

  const [minutesUntilClose, setMinutesUntilClose] = useState(10);

  const canGovern = !!props.charterOfferId;

  function handleCheckChange(event) {
    const { target } = event;
    assert(target.type === 'checkbox');
    const { name } = target;
    setChecked({ ...checked, [name]: target.checked });
  }

  function handleSubmit(event) {
    event.preventDefault();
    console.debug({ event, checked, minutesUntilClose });
    const toPause = Object.entries(checked)
      .filter(([_, check]) => check)
      .map(([name]) => name);
    const offer = walletUtils.makeVoteOnPauseLiquidationOffers(
      props.charterOfferId,
      toPause,
      minutesUntilClose,
    );
    void walletUtils.sendOffer(offer);
  }

  const optionMessage = option => {
    switch (option) {
      case invitationDescriptions.newBid:
        return `Pause '${invitationDescriptions.newBid}' — Users will not be able to make new bids on liquidation auctions.`;
      default:
        return option;
    }
  };

  return (
    <motion.div
      className="overflow-hidden px-1"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      transition={{ type: 'tween' }}
    >
      <form onSubmit={handleSubmit}>
        <h2 className="mb-2 block text-lg leading-5 font-medium text-gray-700">
          Pause Offers
        </h2>
        <p className="text-warning">Current filter not displayed</p>
        <div className="block my-4">
          {Object.keys(checked).map(str => (
            <div key={str} className="my-2 leading-5">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="cursor-pointer text-primary focus:border-primary focus:ring-primary"
                  name={str}
                  checked={checked[str]}
                  onChange={handleCheckChange}
                />
                <span className="ml-2">{optionMessage(str)}</span>
              </label>
            </div>
          ))}
        </div>
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
          <SubmitInput canSubmit={canGovern} value="Propose Pause Offers" />
        </div>
      </form>
    </motion.div>
  );
}
