const { DECIMALS, PRECISION, DURATION_SEC } = require('./constants')
const { deploy } = require('./deploy')
const BigNumber = require('bignumber.js');

class Environment {
  constructor(admin) {
    this.seeds = {}
    this.assets = {}
    this.addresses = {}

    this.seeds.admin = admin

    console.log(`Created new Environment adminAddress=${address(this.seeds.admin)}`)

    if (env.CHAIN_ID === 'R') {
      console.log(`Running in local environment...`)
      this.isLocal = true
    } else {
      this.isLocal = false
    }
  }

  async deploy() {
    console.log(`Begin deploy new environment...`)
    await setupAccounts({
      minter: 2 * 5e6 + 1e8,
      miner: 14e6,
    })

    this.seeds.minter = accounts.minter
    this.seeds.miner = accounts.miner

    if (this.isLocal) {
      await setupAccounts({
        timer: 3 * DECIMALS,
      })

      this.seeds.timer = accounts.timer
    }

    let p1 = deploy(
      'minter.ride',
      5e6,
      this.seeds.minter,
      'Minter',
      this.isLocal,
      address(this.seeds.timer)
    )
    let p2 = deploy(
      'miner.ride',
      5e6,
      this.seeds.miner,
      'Miner',
      this.isLocal,
      address(this.seeds.timer)
    )

    await Promise.all([p1, p2])


    this.miner = new Miner(this, this.seeds.miner)
    this.minter = new Minter(this, this.seeds.minter)

    const i1 = await this.miner.init(this.seeds.minter)
    const i2 = await this.minter.init(this.seeds.miner)

    await Promise.all([i1, i2])

    console.log(`Environment deployed`)
  }

  async setTime(_timestamp) {
    if (!this.isLocal) {
      throw 'Can set time only in local env'
    }

    let setTimerTx = data(
      {
        data: [
          {
            key: 'timestamp',
            type: 'integer',
            value: _timestamp.toFixed(0),
          },
        ],
      },
      this.seeds.timer
    )
    await broadcast(setTimerTx)
    await waitForTx(setTimerTx.id)

    return setTimerTx
  }

  // async forceSetKey(address, key, value) {
  //   let fee = 500000;
  //   await this.ensureDeploymentFee(address, fee);
  //   let senderPublicKey = await publicKeyByAddress(address)
  //   const tx = data(
  //     {
  //       senderPublicKey,
  //       fee,
  //       data: [
  //         {
  //           key,
  //           value,
  //         },
  //       ],
  //     },
  //     this.seeds.admin
  //   );

  //   await broadcast(tx)
  //   await waitForTx(tx.id)

  //   console.log(`Updated key ${key} to ${value} on ${address} in tx ${tx.id}`)
  //   return tx
  // }

  async getCurrentTimestamp() {
    const { value } = await accountDataByKey('timestamp', address(this.seeds.timer))
    return value
  }
}

class Miner {
  constructor(e, address, sender) {
    this.e = e
    this.address = address
    this.sender = sender
  }

  as(_sender) {
    return new Miner(this.e, this.address, _sender)
  }

  async init(minter) {
    const minerInitTx = await invokeScript({
      dApp: address(this.address),
      call: {
        function: 'init',
        args: [{ type: 'string', value: address(minter) }]
      },
      fee: 9e6
    }, this.address)

    await broadcast(minerInitTx)
    await waitForTx(minerInitTx.id)
    console.log(`Miner inited ${minerInitTx.id}`)
    return minerInitTx.id
  }

  async topUp(amount) {
    const transferTx = transfer({
      recipient: address(this.address),
      amount: Math.round(amount * DECIMALS),
    }, global.env.SEED)
    await broadcast(transferTx);
    await waitForTx(transferTx.id);
    console.log(`Added ${amount} Waves as mining reward to miner.`)
    return transferTx.id
  }
}


class Minter {
  constructor(e, address, sender) {
    this.e = e
    this.address = address
    this.sender = sender
  }

  as(_sender) {
    return new Minter(this.e, this.address, _sender)
  }

  async init(miner) {
    const minterInitTx = invokeScript({
      dApp: address(this.address),
      call: {
        function: 'init',
        args: [{ type: 'string', value: address(miner) }]
      },
      fee: Math.round(1.009 * DECIMALS),
    }, this.address)
    await broadcast(minterInitTx)
    await waitForTx(minterInitTx.id)
    return minterInitTx.id
  }

  async getKey(key) {
    const { value } = await accountDataByKey(key, address(this.address))
    return value
  }

  async getSWavesAssetId() {
    const key = 'k_sWavesAssetId'
    return this.getKey(key)
  }

  async getLastRate() {
    const key = 'k_lastRate'
    try {
      return await this.getKey(key)
    } catch (e) {
      return PRECISION
    }
  }

  async getGrowthRate() {
    const key = 'k_growthRate'
    try {
      return await this.getKey(key)
    } catch (e) {
      return 0
    }
  }

  async getLastCompoundTime() {
    const key = 'k_lastCompoundTime'
    try {
      return await this.getKey(key)
    } catch (e) {
      return 0
    }
  }

  async getPeriodFinish() {
    const key = 'k_periodFinish'
    try {
      return await this.getKey(key)
    } catch (e) {
      return 0
    }
  }

  async getCurrentRate() {
    const lastRate = new BigNumber(await this.getLastRate())
    const growthRate = new BigNumber(await this.getGrowthRate())
    const lastCompoundTime = await this.getLastCompoundTime()
    const periodFinish = await this.getPeriodFinish()
    const currentTimestamp = parseInt(await this.e.getCurrentTimestamp() / 1000)

    const dt = currentTimestamp < periodFinish ? currentTimestamp - lastCompoundTime : DURATION_SEC
    return growthRate.times(dt).plus(lastRate).toFixed(0)
  }


  async stake(_amount) {
    const tx = await invokeScript({
      dApp: address(this.address),
      call: {
        function: 'stake',
      },
      payment: [
        {
          assetId: "WAVES",
          amount: Math.round(_amount * DECIMALS),
        },
      ],
    }, this.sender)
    await broadcast(tx)
    await waitForTx(tx.id)
    return tx
  }

  async unstake(_amount) {
    const assetId = await this.getSWavesAssetId()
    const tx = await invokeScript({
      dApp: address(this.address),
      call: {
        function: 'unstake',
        args: [],
      },
      payment: [
        {
          amount: Math.round(_amount * DECIMALS),
          assetId
        }
      ]
    }, this.sender)
    await broadcast(tx)
    await waitForTx(tx.id)
    return tx
  }

  async compound() {
    const tx = await invokeScript({
      dApp: address(this.address),
      call: {
        function: 'compound',
        args: []
      }
    }, this.e.seeds.admin)
    await broadcast(tx)
    await waitForTx(tx.id)
    return tx
  }

}


module.exports = {
  Environment
}
