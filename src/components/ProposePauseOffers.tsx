import { useAtomValue } from 'jotai';
import { WalletContext } from 'lib/wallet';
import { useContext, useState } from 'react';
import { instanceIdsAtom } from 'store/app';

interface Props {
  anchorName: string;
}

export default function ProposePauseOffers(props: Props) {
  const walletUtils = useContext(WalletContext);
  // read the initial state from rpc?
  const [checked, setChecked] = useState({
    wantMinted: false,
    wantStable: false,
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
      props.anchorName,
      toPause,
      minutesUntilClose
    );
    walletUtils.sendOffer(offer);
    event.preventDefault();
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>VoteOnPauseOffers</h3>

      <div>
        {Object.keys(checked).map(str => (
          <label key={str}>
            {str}
            <input
              type="checkbox"
              name={str}
              checked={checked[str]}
              onChange={handleCheckChange}
            />
          </label>
        ))}
      </div>

      <label>
        Minutes until close:
        <input
          type="number"
          value={minutesUntilClose}
          onChange={e => setMinutesUntilClose(e.target.valueAsNumber)}
        />
      </label>

      <input type="submit" value="Propose pausing offers" />
    </form>
  );
}
