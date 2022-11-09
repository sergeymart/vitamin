const precision = 10 ** 18
const decimals = 3
let lastTimestamp = Date.now()
let lastRate = precision
let balance = 100
let sWaves = 100
let mined = 0
let tokenRatePerSec = 0
let currentRate = precision
let cmpRate = precision

const print = console.log

const compound = () => {
  cmpRate = (balance + mined) / sWaves * precision // for dev

  print('=========== COMPOUND =============')
  const dt = ((Date.now() - lastTimestamp))


  if (dt < 100) {
    print('===== COMPOUND RATE TOO FAST =====')
    return
  }

  lastRate += tokenRatePerSec * dt
  lastTimestamp = Date.now()
  tokenRatePerSec = (mined / sWaves * precision) / dt

  balance += mined
  mined = 0
}

const stake = (amount) => {
  print(`=========== STAKED ${amount} ===========`)
  let sWavesAmount = amount * precision / currentRate
  balance += amount
  sWaves += sWavesAmount
  compound()
}

const unstake = (amount) => {
  print(`=========== UNSTAKED ${amount} ===========`)
  let wavesAmount = amount * currentRate / precision
  balance -= wavesAmount
  sWaves -= amount
  compound()
}

const realRate = () => (balance + mined) / sWaves * precision // for dev

const mining = () => mined += (balance / 1000 + 0 * Math.random())

const log = () => {

  currentRate = lastRate + tokenRatePerSec * ((Date.now() - lastTimestamp))


  const message = [
    `TS: ${new Date(lastTimestamp).toISOString()}`,
    `RealRate: ${(realRate() / precision).toFixed(decimals)}`,
    `CmpRate: ${(cmpRate / precision).toFixed(decimals)}`,
    `ExchangeRate: ${(currentRate / precision).toFixed(decimals)}`,
    `TokenRate: ${((tokenRatePerSec * 1000) / precision).toFixed(decimals)}`,
    `Balance: ${balance.toFixed(decimals)}`,
    `sWaves: ${sWaves.toFixed(decimals)}`,
    `Mined: ${mined.toFixed(decimals)}`,
  ]

  if (currentRate > realRate()) {
    print('====== CURRENT MORE THAN CMP ======', (realRate() - currentRate) / precision)
  }

  print(message.join(' / '))

}

setInterval(mining, 500)
setInterval(() => {
  if ((Date.now() - lastTimestamp) >= 5000) {
    compound()
  }
}, 30)

setInterval(log, 1000)
