const fetch = require("node-fetch")

const scriptByAddress = async (address) => {
  const json = await fetch(
    `${env.API_BASE}/addresses/scriptInfo/${address}`
  ).then((x) => x.json())
  console.log(`${env.API_BASE}/addresses/scriptInfo/${address}`)
  return (json.script && json.script.replace(`base64:`, ``)) || ""
}

module.exports = {
  scriptByAddress
}
