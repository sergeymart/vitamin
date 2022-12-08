const { Environment } = require('../common/common')

async function main() {
  e = new Environment()
  await e.deploy()
  const stkWavesAssetId = await e.minter.getStkWavesAssetId()
  console.log('stkWavesAssetId:', stkWavesAssetId)
}

main().then(console.log).catch(console.log)


