# Create a vault with a deposit of 15 ATOMs and debt of 100 ISTs
agops vaults open --wantMinted 15 --giveCollateral 100 >/tmp/want-ist.json
agops perf satisfaction --executeOffer /tmp/want-ist.json --from agoric1ydzxwh6f893jvpaslmaz6l8j2ulup9a7x8qvvq --keyring-backend=test

# Create a vault with a deposit of 15 ATOMs and debt of 103 ISTs
agops vaults open --wantMinted 15 --giveCollateral 103 >/tmp/want-ist.json
agops perf satisfaction --executeOffer /tmp/want-ist.json --from agoric1ydzxwh6f893jvpaslmaz6l8j2ulup9a7x8qvvq --keyring-backend=test

# Create a vault with a deposit of 15 ATOMs and debt of 105 ISTs
agops vaults open --wantMinted 15 --giveCollateral 105 >/tmp/want-ist.json
agops perf satisfaction --executeOffer /tmp/want-ist.json --from agoric1ydzxwh6f893jvpaslmaz6l8j2ulup9a7x8qvvq --keyring-backend=test
