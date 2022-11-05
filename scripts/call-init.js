const waves = require('@waves/waves-transactions')

const seed = "order arrange turn pumpkin ketchup hundred must diary sugar industry distance language unusual trial jelly"

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
          "value": "3Mvs7XMkY63gALNeNQVZeRqMfsHeRoH5T2A"
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
