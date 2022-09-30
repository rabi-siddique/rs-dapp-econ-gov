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

  function handleCheckChange(event) {
    const { target } = event;
    assert(target.type === 'checkbox');
    const { name } = target;
    setChecked({ ...checked, [name]: target.checked });
  }

  function handleSubmit(event) {
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
    walletUtils.sendOffer(offer);
    event.preventDefault();
  }

  // styling examples https://tailwindcss-forms.vercel.app/
  return (
    <form className="mt-16" onSubmit={handleSubmit}>
      <h2>VoteOnPauseOffers</h2>

      <div className="block mt-2">
        {Object.keys(checked).map(str => (
          <div key={str}>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name={str}
                checked={checked[str]}
                onChange={handleCheckChange}
              />
              <span className="ml-2">{str}</span>
            </label>
          </div>
        ))}
      </div>

      <label className="block">
        <span className="text-gray-700">Minutes until close of vote</span>
        <input
          type="number"
          className="mt-1 block w-full"
          value={minutesUntilClose}
          onChange={e => setMinutesUntilClose(e.target.valueAsNumber)}
        />
      </label>

      <input
        type="submit"
        value="Propose set to pause"
        className="btn-primary p-1 rounded mt-2"
      />
    </form>
  );
}
