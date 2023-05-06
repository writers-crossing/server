import config from '../data/config.json'

import cron from 'node-cron'
import logger from './app/logger'
import { AwardXp, GoalAudit, User } from './app/entities'
import { Op } from 'sequelize'

async function checkForGoal(userId: string, discordId: string, type: string, goal?: number, actual?: number): Promise<boolean> {
    let metGoal = false
    let awardedXp : number | null = null
    if (goal && actual && goal > 0 && actual > 0 && goal >= actual) {
        metGoal = true
        awardedXp = Math.round(actual * config.awardXpPercentageGoal)

        await AwardXp.create({ discordId: discordId, xp: awardedXp })
    }

    await GoalAudit.create({
        type: type,
        userId: userId,
        goal: goal,
        actual: actual,
        awardedXp: awardedXp,
        metGoal: metGoal
    })

    return metGoal
}

// Daily - WC Reset
cron.schedule('0 0 * * *', async () => {
    const users = await User.findAll({
        where: {
            wcDaily: { [Op.gt]: 0 },
            dailyGoal: { [Op.gt]: 0 }
        }
    })

    for (const user of users) {
        await checkForGoal(user.id, user.discordId, 'daily', user.dailyGoal, user.wcDaily)
    }

    const [result] = await User.update({ wcDaily: 0 }, { where: {} })
    logger.info(`Daily - WC Reset - Reset ${result} records.`)
})

// Weekly - WC Reset
cron.schedule('0 0 * * 1', async () => {
    const users = await User.findAll({
        where: {
            wcWeekly: { [Op.gt]: 0 },
            weeklyGoal: { [Op.gt]: 0 }
        }
    })

    for (const user of users) {
        await checkForGoal(user.id, user.discordId, 'weekly', user.weeklyGoal, user.wcWeekly)
    }

    const [result] = await User.update({ wcWeekly: 0 }, { where: {} })
    logger.info(`Weekly - WC Reset - Reset ${result} records.`)
})

// Monthly - WC Reset
cron.schedule('0 0 1 * *', async () => {
    const users = await User.findAll({
        where: {
            wcMonthly: { [Op.gt]: 0 },
            monthlyGoal: { [Op.gt]: 0 }
        }
    })

    for (const user of users) {
        await checkForGoal(user.id, user.discordId, 'monthly', user.monthlyGoal, user.wcMonthly)
    }

    const [result] = await User.update({ wcMonthly: 0 }, { where: {} })
    logger.info(`Monthly - WC Reset - Reset ${result} records.`)
})

// Yearly - WC Reset
cron.schedule('59 23 31 12 *', async () => {
    const users = await User.findAll({
        where: {
            wcYearly: { [Op.gt]: 0 },
            yearlyGoal: { [Op.gt]: 0 }
        }
    })

    for (const user of users) {
        await checkForGoal(user.id, user.discordId, 'yearly', user.yearlyGoal, user.wcYearly)
    }

    const [result] = await User.update({ wcYearly: 0 }, { where: {} })
    logger.info(`Yearly - WC Reset - Reset ${result} records.`)
})

logger.info('Startup completed.')