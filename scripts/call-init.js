const waves = require('@waves/waves-transactions')

const seed = "actual nerve limit win east legal garage define order eye state endless enter erase flat"

const nodeAddress = 'https://nodes-testnet.wavesnodes.com/'

const main = async () => {

  const { keyPair, address } = new waves.seedUtils.Seed(seed, 'T')

  const tx = waves.invokeScript({
    "type": 16,
    "version": 2,
    "senderPublicKey": keyPair.publicKey,
    "dApp": address,
    "call": {
      "args": [
        {
          "type": "string",
          "value": "3Mtxa8ryD7D8A53ojJzSLYGRT7rqRSQDLpi"
        }
      ],
      "function": "compound"
    },
    "payment": [],
    "fee": "900000",
    "feeAssetId": null,
    "timestamp": Date.now(),
    "chainId": 'T'.charCodeAt(0),
    "proofs": [],
  }, keyPair)

  return waves.broadcast(tx, nodeAddress)

}

main()
  .then(console.log)
  .catch(console.error)
