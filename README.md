# dapp-governance

UI for Governance of Inter Protocol

# Development

Link to agoric-sdk working tree and refresh vite deps:

```
yarn link @agoric/notifier
yarn link @agoric/smart-wallet
rm -rf node_modules/.vite/deps
```

Start a wallet client server for network-config:

```
cd sdk/packages/wallet/ui
yarn start
```

Start a dev server with fast refresh:

```
yarn dev
```
