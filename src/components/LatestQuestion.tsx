/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/anchor-has-content */
import { WalletContext } from 'lib/wallet';
import { useContext, useEffect, useState } from 'react';
import { bigintStringify } from '@agoric/wallet-backend/src/bigintStringify.js';

const usePublishedDatum = path => {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState([]);
  const walletUtils = useContext(WalletContext);

  useEffect(() => {
    const { follow } = walletUtils;
    const fetchData = async () => {
      const follower = await follow(`:published.${path}`);
      const iterable: AsyncIterable<Record<string, unknown>> =
        await follower.getLatestIterable();
      setStatus('got iterable');
      const iterator = iterable[Symbol.asyncIterator]();
      setStatus('awaiting a question');
      const { value: publishedValue } = await iterator.next();
      setData(publishedValue.value);
      setStatus('latest question');
    };
    fetchData().catch(e => console.error('useEffect error', e));
  }, [path, walletUtils]);

  return { status, data };
};

export default function LatestQuestion(props: Props) {
  const { status, data } = usePublishedDatum(
    'committees.Initial_Economic_Committee.latestQuestion'
  );

  console.log('render LatestQuestion', status, Object.entries(data));
  return (
    <>
      <b>{status}</b>
      <table>
        {Object.entries(data).map(([k, v]) => (
          <tr key={k}>
            <th>{k}</th>
            <td>
              <tt>{bigintStringify(v)}</tt>
            </td>
          </tr>
        ))}
      </table>
    </>
  );
}
