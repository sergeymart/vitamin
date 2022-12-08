const { DECIMALS, PRECISION, DURATION, DURATION_SEC } = require('../common/constants')
const { Environment } = require('../common/common')
const { wait } = require('../common/wait');
const BigNumber = require('bignumber.js');

chai.config.includeStack = true;
chai.use(require('chai-as-promised'))

process.on('unhandledRejection', (error) => {
    console.log('unhandledRejection', JSON.stringify(error))
})


BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: BigNumber.ROUND_HALF_EVEN })

// describe.skip('Calc', () => {
//     it('', async () => {
//         const minter = {
//             balance: 1e8,
//             rate: 1e18,
//             growthRate: 0,
//             timestamp: 0,
//             periodFinish: 0,
//             leased: 0,
//         }

//         const miner = {
//             balance: 1e8
//         }

//         const sleep = async (delay) => new Promise((resolve) => setTimeout(resolve, delay))

//         const DURATION = 86400

//         const getTimestampSec = () => +(Date.now() / 1000).toFixed(0)

//         const dt = () => Math.min(minter.timestamp, minter.periodFinish)

//         const currentRate = () => minter.rate + minter.growthRate * dt()

//         const compound = () => {
//             const excessWaves = new BigNumber(miner.balance)
//             if (excessWaves.gte(1e8)) {
//                 miner.balance = 0
//                 const newRate = currentRate()
//                 const ts = getTimestampSec()
//                 let newGrowthRate = 0
//                 if (ts > minter.periodFinish) {
//                     newGrowthRate = excessWaves.times(PRECISION).div(DECIMALS * DURATION)
//                 } else {
//                     const remainingTime = minter.periodFinish - getTimestampSec()
//                     const leftover = (new BigNumber(minter.growthRate)).times(remainingTime)
//                     newGrowthRate = excessWaves.plus(leftover).div(DECIMALS * DURATION)
//                 }
//                 minter.rate = newRate
//                 minter.growthRate = +newGrowthRate.toFixed(0)
//                 minter.periodFinish = ts + DURATION
//                 minter.timestamp = ts
//                 minter.leased += +excessWaves.toFixed(0)
//             }
//         }

//         for (let i = 0; i < 5; i++) {
//             if (i % 2) miner.balance = 1e8
//             console.log(i, minter)
//             compound()
//             await sleep(5000)
//         }

//     })
// })

const now = Date.now()

describe('ROOT', () => {
    let e
    before(async () => {
        await setupAccounts({
            admin: 10e8,
            staker1: 2e8,
            staker2: 2e8,
        })

        e = new Environment(accounts.admin)
        await e.deploy()
        await e.setTime(now)
    })

    describe('STAKER 1 stake', () => {
        it('Should stake 1 Waves and get 1 stkWaves', async () => {
            const stkWavesAssetId = await e.minter.getStkWavesAssetId()
            await e.minter.as(accounts.staker1).stake(1)
            const amount = await assetBalance(stkWavesAssetId, address(accounts.staker1))
            expect(amount).equal(DECIMALS)
        })
        it('Should store 1 Waves to k_balance', async () => {
            const { value } = await accountDataByKey('k_balance', address(accounts.minter))
            expect(value).equal(DECIMALS)
        })
        it('Should lease 1 Waves to Miner', async () => {
            const { effective, available } = await balanceDetails(address(accounts.miner))
            expect(effective - available).equal(DECIMALS)
        })
    })

    describe('COMPOUND', () => {
        before(async () => {
            await e.miner.topUp(1)
        })
        it('Miner: should receive 1 Waves as mining reward', async () => {
            const { regular } = await balanceDetails(address(accounts.miner))
            expect(regular).equal(1e8)
        })
        it('Minter: should take 1 Waves from miner and calculate new rate', async () => {
            await e.setTime(now)
            await e.minter.compound()
            const kGrowthRate = await e.minter.getGrowthRate()
            expect(+kGrowthRate).equal(Math.round(PRECISION / DURATION_SEC))
        })
    })

    describe('STAKER 1 unstake', () => {
        it('Should receive 1.5 Waves for 1 stkWaves after 12 hours', async () => {
            await e.setTime(now + DURATION / 2)
            const stkWavesAssetId = await e.minter.getStkWavesAssetId()

            const amount = await assetBalance(stkWavesAssetId, address(accounts.staker1))

            const unstakeTx = await e.minter.as(accounts.staker1).unstake(1)

            const currentRate = await e.minter.getCurrentRate()

            const expectedWaves = new BigNumber(amount).times(currentRate).div(PRECISION).toNumber()

            const changes = await stateChanges(unstakeTx.id)

            const unstakedAmount = changes.transfers[0].amount
            const unstakeRecipient = changes.transfers[0].address

            expect(expectedWaves).equal(unstakedAmount)
            expect(address(accounts.staker1)).equal(unstakeRecipient)
        })
    })

    describe('STAKER 2 calculations', () => {
        it('Shoud stake 1 Waves and get 0.66666667 stkWaves', async () => {
            const stakeTx = await e.minter.as(accounts.staker2).stake(1)
            const changes = await stateChanges(stakeTx.id)

            const currentRate = await e.minter.getCurrentRate()

            const expectedStkWaves = new BigNumber(DECIMALS).times(PRECISION).dividedBy(currentRate).toNumber()

            const receivedStkWaves = changes.transfers[0].amount

            expect(expectedStkWaves).equal(receivedStkWaves)
        })
        // @todo check rate and ts keys
        it('Should receive +0.5 Waves when unstake after 1 day', async () => {
            await e.setTime(now + DURATION)

            const stkWavesAssetId = await e.minter.getStkWavesAssetId()
            const stkWavesBalance = await assetBalance(stkWavesAssetId, address(accounts.staker2))
            const amount = (stkWavesBalance / DECIMALS).toFixed(8)

            const unstakeTx = await e.minter.as(accounts.staker2).unstake(amount)
            const changes = await stateChanges(unstakeTx.id)

            const unstakedAmount = changes.transfers[0].amount

            const currentRate = await e.minter.getCurrentRate()
            const expectedWaves = new BigNumber(amount * DECIMALS).times(currentRate).div(PRECISION).toNumber()

            expect(expectedWaves).equal(unstakedAmount)

        })
    })

})

