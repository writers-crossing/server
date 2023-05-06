import cron from 'node-cron'
import logger from './app/logger'
import { AwardXp, Sprint, User } from './app/entities'
import { Op } from 'sequelize';
import sequelize from './app/sequelize';

// Hourly - Cleanup
cron.schedule('0 * * * *', async () => {
    const [sprintsTerminatedAffectedCount] = await Sprint.update({ ended: true }, { where: { ended: false } })
    
    if (sprintsTerminatedAffectedCount > 0) {
        logger.warn(`Cleared ${sprintsTerminatedAffectedCount} sprints that were terminated midway.`)
    }
})

// Daily - WC Reset
cron.schedule('0 0 * * *', async () => {
    const users = await User.findAll({ where: { dailyGoal: { [Op.gte]: sequelize.col('wcDaily') } } })
    for (const user of users) {
        await AwardXp.create({ discordId: user.discordId, xp: 1 })
    }

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