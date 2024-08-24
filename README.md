# dapp-governance

UI for Governance of Inter Protocol

![image](https://user-images.githubusercontent.com/150986/202804842-e7def6b9-9136-4541-b93e-6ccd2ab1a039.png)

# Development

# Test net

Start HMR server:

```
yarn dev
```

Open app against a network config, e.g. ollinet

```
open http://127.0.0.1:5173/?agoricNet=ollinet
```

## Local

Start a wallet client server for network-config:

```
cd wallet-app
yarn start
```

Start a dev server with fast refresh:

```
yarn dev
```

Launch pointing to your localhost:

```
open http://127.0.0.1:5173/?agoricNet=local
```

## Testing

E2E tests have been written in order to test the dapp as well as to perform automated testing on emerynet/devnet when upgrading the chain

There are two ways to run the tests:

### On Local Machine

To run tests on your local machine, first you need to start the frontend server:

```
yarn dev
```

Then you need to run the tests using

```
CYPRESS_AGORIC_NET=<network> yarn test:e2e
```

where `network` can be: `local`, `emerynet`, or `devnet`

In case the tests are run on `local` network, you need to startup a local a3p chain using

```
docker compose -f tests/e2e/docker-compose.yml up -d agd
```

Note: the tests use chrome browser by default so they require it to be installed

### On Github

To run the tests on github, you can use the workflow trigger to run the tests.

Go to: Actions > E2E Tests (On the left sidebar) > Run Workflow

It provides a handful of parameters that can be used to modify the run according to your needs

- `branch` you can change the branch on which the tests run
- `network` you can change the network on which to run the tests
- `gov1 mnemonic` you can set a custom mnemonic of the wallet you want to use for the first economic committee member (this param does not work for `local` network)
- `gov2 mnemonic` you can set a custom mnemonic of the wallet you want to use for the second economic committee member (this param does not work for `local` network)
