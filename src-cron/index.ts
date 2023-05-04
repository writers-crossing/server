import cron from 'node-cron'
import logger from './app/logger'
import { User } from './app/entities'

// Daily - WC Reset
cron.schedule('0 0 * * *', async () => {
    const [result] = await User.update({ wcDaily: 0 }, { where: {} })
    logger.info(`Daily - WC Reset - Reset ${result} records.`)
})

// Monthly - WC Reset
cron.schedule('0 0 1 * *', async () => {
    const [result] = await User.update({ wcMonthly: 0 }, { where: {} })
    logger.info(`Monthly - WC Reset - Reset ${result} records.`)
})

// Yearly - WC Reset
cron.schedule('0 0 1 1 *', async () => {
    const [result] = await User.update({ wcYearly: 0 }, { where: {} })
    logger.info(`Yearly - WC Reset - Reset ${result} records.`)
})

logger.info('Startup completed.')