const waves = require('@waves/waves-transactions')

const contractId = "3Mudc2DKz8b3di2jDyxJUPnFQbXmJWAPrxh"
const seed = "into early double tortoise mean struggle march maze mother wild end quiz provide black ozone"

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
      "function": "stake"
    },
    "payment": [{
      assetId: null,
      amount: 100000000
    }],
    "fee": "5000000",
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
