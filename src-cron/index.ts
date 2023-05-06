import cron from 'node-cron'
import logger from './app/logger'
import { AwardXp, User } from './app/entities'
import { Op } from 'sequelize';
import sequelize from './app/sequelize'

const awardCalc = 0.05

// Daily - WC Reset
cron.schedule('0 0 * * *', async () => {
    const users = await User.findAll({
        where: {
            dailyGoal: { [Op.gt]: 0, [Op.gte]: sequelize.col('wcDaily') }
        }
    })

    for (const user of users) {
        if (user.dailyGoal && user.dailyGoal > 0) {
            await AwardXp.create({ discordId: user.discordId, xp: user.dailyGoal * awardCalc })
        }
    }

    const [result] = await User.update({ wcDaily: 0 }, { where: {} })
    logger.info(`Daily - WC Reset - Reset ${result} records.`)
})

// Weekly - WC Reset
cron.schedule('0 0 * * 1', async () => {
    const users = await User.findAll({
        where: {
            weeklyGoal: { [Op.gt]: 0, [Op.gte]: sequelize.col('wcWeekly') }
        }
    })

    for (const user of users) {
        if (user.weeklyGoal && user.weeklyGoal > 0) {
            await AwardXp.create({ discordId: user.discordId, xp: user.weeklyGoal * awardCalc })
        }
    }

    const [result] = await User.update({ wcWeekly: 0 }, { where: {} })
    logger.info(`Weekly - WC Reset - Reset ${result} records.`)
})

// Monthly - WC Reset
cron.schedule('0 0 1 * *', async () => {
    const users = await User.findAll({
        where: {
            monthlyGoal: { [Op.gt]: 0, [Op.gte]: sequelize.col('wcMonthly') }
        }
    })

    for (const user of users) {
        if (user.monthlyGoal && user.monthlyGoal > 0) {
            await AwardXp.create({ discordId: user.discordId, xp: user.monthlyGoal * 0.005 })
        }
    }

    const [result] = await User.update({ wcMonthly: 0 }, { where: {} })
    logger.info(`Monthly - WC Reset - Reset ${result} records.`)
})

// Monthly - WC Reset
cron.schedule('59 23 31 12 *', async () => {
    const users = await User.findAll({
        where: {
            yearlyGoal: { [Op.gt]: 0, [Op.gte]: sequelize.col('wcYearly') }
        }
    })

    for (const user of users) {
        if (user.yearlyGoal && user.yearlyGoal > 0) {
            await AwardXp.create({ discordId: user.discordId, xp: user.yearlyGoal * awardCalc })
        }
    }

    const [result] = await User.update({ wcYearly: 0 }, { where: {} })
    logger.info(`Yearly - WC Reset - Reset ${result} records.`)
})

logger.info('Startup completed.')