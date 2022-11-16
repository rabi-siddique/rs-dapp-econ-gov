import clsx from 'clsx';
import { WalletContext } from 'lib/wallet';
import { useContext, useState } from 'react';

interface Props {
  anchorName: string;
  psmCharterOfferId: number;
}

export default function ProposePauseOffers(props: Props) {
  const walletUtils = useContext(WalletContext);
  // read the initial state from rpc?
  const [checked, setChecked] = useState({
    wantMinted: false,
    giveMinted: false,
  });

  const [minutesUntilClose, setMinutesUntilClose] = useState(10);

  const canGovern = !!props.psmCharterOfferId;

  function handleCheckChange(event) {
    const { target } = event;
    assert(target.type === 'checkbox');
    const { name } = target;
    setChecked({ ...checked, [name]: target.checked });
  }

  function handleSubmit(event) {
    event.preventDefault();
    console.log({ event, checked, minutesUntilClose });
    const toPause = Object.entries(checked)
      .filter(([_, check]) => check)
      .map(([name]) => name);
    const offer = walletUtils.makeVoteOnPauseOffers(
      props.psmCharterOfferId,
      props.anchorName,
      toPause,
      minutesUntilClose
    );
    void walletUtils.sendOffer(offer);
  }

  const optionMessage = option => {
    switch (option) {
      case 'wantMinted':
        return 'Propose IST minting pause (Users will not be able to swap supported stable tokens for IST in PSM) (wantMinted)';
      case 'giveMinted':
        return 'Propose IST burning pause (Users will not be able to swap IST for supported stable tokens in PSM) (giveMinted)';
      default:
        return option;
    }
  };

  // styling examples https://tailwindcss-forms.vercel.app/
  return (
    <form onSubmit={handleSubmit}>
      <h2 className="mb-2 block text-lg leading-5 font-medium text-gray-700">
        Pause Offers
      </h2>
      <div className="text-gray-500">
        <i>Current filter not displayed</i>
      </div>
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
          className="mt-1 block w-full border-gray-300 focus:border-purple-300 focus:ring-purple-300"
          value={minutesUntilClose}
          onChange={e => setMinutesUntilClose(e.target.valueAsNumber)}
        />
      </label>
      <div className="w-full flex flex-row justify-end mt-2">
        <input
          type="submit"
          value="Propose Pause Offer Proposal"
          className={clsx(
            'btn-primary p-2 rounded mt-2',
            canGovern ? 'cursor-pointer' : 'cursor-not-allowed'
          )}
          disabled={!canGovern}
        />
      </div>
    </form>
  );
}
