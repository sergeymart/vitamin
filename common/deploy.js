const { scriptByAddress } = require('./node.js')

const deploy = async (filename, fee, seed, name, injectTimer, timerAddress) => {
  let code = file(filename);
  if (injectTimer) {
    code = code.replace(
      "lastBlock.timestamp",
      `addressFromStringValue("${timerAddress}").getInteger("timestamp").valueOrElse(${new Date().getTime()})`
    );
    console.log(`Injected timer to ${name}`)
  }
  const script = compile(code);
  const oldScript = await scriptByAddress(address(seed))
  if (script === oldScript) {
    console.log(`${name} already deployed to ${address(seed)}`)
    return;
  }
  const tx = setScript({ script, fee }, seed);
  await broadcast(tx);
  console.log(`${name} deployed to ${address(seed)} in ${tx.id}`)
  return waitForTx(tx.id)
}

module.exports = {
  deploy
}
