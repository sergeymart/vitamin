const waves = require('@waves/waves-transactions')

const seed = "start example lesson matter nurse bean option judge nothing angle surge hungry symptom expand bullet"

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
          "value": "3N29B91KwMtcqXP9uXzEi1Re9nRHmCiC8sp"
        }
      ],
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
