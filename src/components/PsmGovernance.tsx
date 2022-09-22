import ProposeChange from './ProposeChange';

interface Props {
  instanceName: string;
}

export default function PsmGovernance(props: Props) {
  return (
    <div>
      <h2>{props.instanceName}</h2>
      <ProposeChange paramName="MintLimit" />
      <ProposeChange paramName="GiveMintedFee" />
      <ProposeChange paramName="WantMintedFee" />
      <ProposeChange paramName="OfferFilter" />
    </div>
  );
}
