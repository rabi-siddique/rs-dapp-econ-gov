import { bigintStringify } from '@agoric/wallet-backend/src/bigintStringify.js';
import { RadioGroup } from '@headlessui/react';
import { makeWalletUtils, usePublishedDatum, WalletContext } from 'lib/wallet';
import { useContext, useState } from 'react';

export function QuestionDetails(props: Props) {
  const { details } = props;
  return (
    <>
      <table>
        <tbody>
          {Object.entries(details).map(([k, v]) => (
            <tr key={k}>
              <th>{k}</th>
              <td>
                <tt>{bigintStringify(v)}</tt>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function VoteOnLatestQuestion(props) {
  const walletUtils = useContext(WalletContext);
  const { status, data } = usePublishedDatum(
    'committees.Initial_Economic_Committee.latestQuestion'
  );
  const [position, setPosition] = useState(null);

  console.log('render VoteOnLatestQuestion', status, data);
  if (!data?.positions) {
    return <b>{status}</b>;
  }

  function handleSubmit(event) {
    console.log('voting for position', position);
    const offer = walletUtils.makeOfferToVote([position], data.questionHandle);
    walletUtils.sendOffer(offer);
    event.preventDefault();
  }

  return (
    <>
      <QuestionDetails details={data} />
      <form onSubmit={handleSubmit}>
        <RadioGroup value={position} onChange={setPosition}>
          <RadioGroup.Label>Positions</RadioGroup.Label>
          {data.positions.map(pos => (
            <RadioGroup.Option value={pos} key={JSON.stringify(pos)}>
              {({ checked }) => (
                <span className={checked ? 'bg-blue-200' : ''}>
                  {JSON.stringify(pos)}
                </span>
              )}
            </RadioGroup.Option>
          ))}
        </RadioGroup>
        <input type="submit" value="Submit vote" disabled={!position} />
      </form>
    </>
  );
}
