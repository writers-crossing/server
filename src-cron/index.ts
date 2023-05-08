import config from '../data/config.json'

import cron from 'node-cron'
import logger from './app/logger'
import { AwardXp, User } from './app/entities'

async function checkForGoal(discordId: string, type: string, goal?: number, actual?: number): Promise<number> {
    let awardedXp = 0

    if (goal && actual && goal > 0 && actual > 0 && goal >= actual) {
        awardedXp = Math.round(actual * config.awardXpPercentageGoal)

        logger.info(`Awarding ${awardedXp} XP for ${type} to ${discordId}.`)
        await AwardXp.create({
            discordId: discordId,
            type: type,
            xp: awardedXp
        })
    }

    return awardedXp
}

// Daily Job
cron.schedule('0 0 * * *', async () => {
    const now = new Date()
    const isStartOfWeek = now.getDay() === 1
    const isStartOfMonth = now.getDate() === 1
    const isStartOfYear = now.getMonth() === 0 && now.getDate() === 1

    const users = await User.findAll()

    for (const user of users) {
        logger.info(`Checking goals for user ${user.id} ${user.name}`)

        const xp = await checkForGoal(user.discordId, 'daily goal', user.dailyGoal, user.wcDaily)
        if (xp === 0) { user.dailyStreak = 0 }
        else { user.dailyStreak += 1 }

        if (isStartOfWeek) {
            await checkForGoal(user.discordId, 'weekly goal', user.weeklyGoal, user.wcWeekly)
        }

        if (isStartOfMonth) {
            await checkForGoal(user.discordId, 'monthly goal', user.monthlyGoal, user.wcMonthly)
        }

        if (isStartOfYear) {
            await checkForGoal(user.discordId, 'yearly goal', user.yearlyGoal, user.wcYearly)
        }
    }

    await User.update({ wcDaily: 0 }, { where: {} })
    logger.info('Reset all wcDaily rows.')

    if (isStartOfWeek) {
        await User.update({ wcWeekly: 0 }, { where: {} })
        logger.info('Reset all wcWeekly rows.')
    }

    if (isStartOfMonth) {
        await User.update({ wcMonthly: 0 }, { where: {} })
        logger.info('Reset all wcMonthly rows.')
    }

    if (isStartOfYear) {
        await User.update({ wcYearly: 0 }, { where: {} })
        logger.info('Reset all wcYearly rows.')
    }
})

logger.info('Startup completed.')