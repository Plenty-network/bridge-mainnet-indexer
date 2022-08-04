
# Plenty Bridge Indexer

This indexer aims to ease Bridge from (Tezos -> Ethereum) and (Ethereum -> Tezos) via dapps.

## Features

### Indexing

* Tezos quorum current state.
* Ethereum quorum current state.
* Tokens list managed by the protocol.
* Current fee rate.  
* Initial bridge transactions on Ethereum.
* Initial bridge operations on Tezos.
* Signatures produced by signers of the protocol and published on IPFS.
* Finalized bridge transactions on Tezos.
* Finalized bridge transactions on Ethereum.

### API

* Get current protocol configuration. (tokens list, contracts addresses, signatures threshold...)
* Get bridge and un-bridge state by source or destination address. This includes signatures needed to finalize wraps and unwraps.

### Others

* Pin IPFS publications of all signers to local IPFS

## Prerequisites

* Docker


## Local deployment

Edit `docker-compose.yml` with right config and run the following command.

`docker-compose up`

## Versioning

`npm version`
