const waves = require('@waves/waves-transactions')

const contractId = "3Mudc2DKz8b3di2jDyxJUPnFQbXmJWAPrxh"
const seed = "rabbit night song onion parent top spike shrimp success solid jungle drink crane federal illness"

const nodeAddress = 'https://nodes-testnet.wavesnodes.com/'


const main = async () => {

  const { keyPair, address } = new waves.seedUtils.Seed(seed)

  const tx = waves.invokeScript({
    "type": 16,
    "version": 2,
    "senderPublicKey": keyPair.publicKey,
    "dApp": contractId,
    "call": {
      "args": [],
      "function": "init"
    },
    "payment": [],
    "fee": "100900000",
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
