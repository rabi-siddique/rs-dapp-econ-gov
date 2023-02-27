import { WalletContext } from 'lib/wallet';

interface Props {
  sourceContract: string;
  description: string;
}
export default function AcceptInvitation(props: Props) {
  return (
    <WalletContext.Consumer>
      {walletUtils => (
        <button
          className="btn-primary rounded text-sm py-1 px-2 m-2"
          title={props.sourceContract}
          onClick={() => {
            const offer = walletUtils.makeOfferToAcceptInvitation(
              props.sourceContract,
              props.description,
            );
            void walletUtils.sendOffer(offer);
          }}
        >
          Accept Invitation
        </button>
      )}
    </WalletContext.Consumer>
  );
}
