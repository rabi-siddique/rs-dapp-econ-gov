import { useAtom } from 'jotai';
import { useContext, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { INTER_LOGO } from 'assets/assets';
import WalletConnection from 'components/WalletConnection';
import {
  brandToInfoAtom,
  governedParamsIndexAtom,
  instanceIdsAtom,
  metricsIndexAtom,
  offersAtom,
  pursesAtom,
  walletAtom,
} from 'store/app';
import { watchContract, watchOffers, watchPurses } from 'utils/updates';

import GovernanceTools from 'components/GovernanceTools';
import { WalletContext } from 'lib/wallet';
import 'styles/globals.css';

interface Props {}

const NetPicker = (props: { currentNet: string }) => {
  return (
    <div style={{ padding: 2 }}>
      {['main', 'testnet', 'ollinet', 'devnet', 'local'].map(net => {
        if (net === props.currentNet) {
          return (
            <b key={net} style={{ paddingRight: 4 }}>
              {net}
            </b>
          );
        }
        return (
          <a key={net} href={`/?agoricNet=${net}`} style={{ paddingRight: 4 }}>
            {net}
          </a>
        );
      })}
    </div>
  );
};

const App = (_props: Props) => {
  const [wallet] = useAtom(walletAtom);
  const walletUtils = useContext(WalletContext);
  const [_brandToInfo, mergeBrandToInfo] = useAtom(brandToInfoAtom);
  const [_purses, setPurses] = useAtom(pursesAtom);
  const [_offers, setOffers] = useAtom(offersAtom);
  const [_metrics, setMetricsIndex] = useAtom(metricsIndexAtom);
  const [_governedParams, setGovernedParamsIndex] = useAtom(
    governedParamsIndexAtom
  );
  const [_instanceIds, setInstanceIds] = useAtom(instanceIdsAtom);

  useEffect(() => {
    if (wallet === null) return;

    // TODO: More user-friendly error handling, like a toast.
    watchPurses(wallet, setPurses, mergeBrandToInfo).catch((err: Error) =>
      console.error('got watchPurses err', err)
    );
    watchOffers(wallet, setOffers).catch((err: Error) =>
      console.error('got watchOffers err', err)
    );

    watchContract(wallet, {
      setMetricsIndex,
      setGovernedParamsIndex,
      setInstanceIds,
    });
  }, [
    wallet,
    mergeBrandToInfo,
    setPurses,
    setOffers,
    setMetricsIndex,
    setGovernedParamsIndex,
    setInstanceIds,
  ]);

  const address = walletUtils.getWalletAddress();

  return (
    <>
      <ToastContainer
        enableMultiContainer
        containerId={'Info'}
        position={'bottom-center'}
        closeOnClick={false}
        newestOnTop={true}
        hideProgressBar={true}
        autoClose={false}
      ></ToastContainer>
      <div>
        <div className="min-w-screen container p-4 mx-auto flex justify-between items-center">
          <img src={INTER_LOGO} className="item" alt="Inter Logo" width="200" />
          <WalletConnection />
          {address}
          <NetPicker currentNet={walletUtils.agoricNet} />
        </div>
        <div className="min-w-screen container mx-auto flex justify-center mt-16">
          <GovernanceTools walletAddress={address} />
        </div>
      </div>
    </>
  );
};

export default App;
