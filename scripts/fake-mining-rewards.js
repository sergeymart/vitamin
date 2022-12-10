const waves = require('@waves/waves-transactions')
const NODE_ADDRESS = 'https://nodes-testnet.wavesnodes.com/'

const MINER_ADDRESS = '3N78z4Jkz1wjz55kTa3qrBJ4z28gnUoVPdh'
const CONTRACT_ADDRESS = '3Mtxa8ryD7D8A53ojJzSLYGRT7rqRSQDLpi'

const BANK_ADDRESS = '3MzNNn4EVwLeY7hWN7C6QaGA4RFpQJverYG'
const BANK_SEED = 'security wood athlete follow business dice canvas foot runway pass system century shift wrong ask'

const endTimestamp = 1671302095415

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

const main = async () => {

  const { keyPair, address } = new waves.seedUtils.Seed(BANK_SEED, 'T')

  // fake mining rewards
  setInterval(async () => {
    const transferTx = waves.transfer({
      recipient: MINER_ADDRESS,
      amount: 1e7,
    }, keyPair)
    const res = await waves.broadcast(transferTx, NODE_ADDRESS)
    console.log(`${new Date()} 1e7 Waves sent: ${JSON.stringify(res)}`)
  }, 6 * 3600 * 1000)


  // call compound
  setInterval(async () => {
    await sleep(60000)
    const tx = waves.invokeScript({
      "dApp": CONTRACT_ADDRESS,
      "call": {
        "args": [],
        "function": "compound"
      },
      "timestamp": Date.now(),
      "chainId": 'T'.charCodeAt(0),
    }, keyPair)

    const res = await waves.broadcast(tx, NODE_ADDRESS)
    console.log(`${new Date()} Compouned called: ${JSON.stringify(res)}`)
  }, 6 * 3600 * 1000)

  setInterval(() => {
    if (Date.now() > endTimestamp) {
      process.exit(1)
    }
  }, 60000)


}

main()
  .then(console.log)
  .catch(console.error)
