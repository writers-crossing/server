import cron from 'node-cron'
import logger from './app/logger'
import { User } from './app/entities'

function checkForGoal(goal?: number, actual?: number): boolean {
    if (goal && actual && goal > 0 && actual > 0 && goal >= actual) {
        return true
    }

    return false
}

// Daily Job
cron.schedule('0 0 * * *', async () => {
    try {
        const now = new Date()
        const isStartOfWeek = now.getDay() === 1
        const isStartOfMonth = now.getDate() === 1
        const isStartOfYear = now.getMonth() === 0 && now.getDate() === 1

        const users = await User.findAll()

        for (const user of users) {
            logger.info(`Checking goals for user ${user.id} ${user.name}`)

            if (checkForGoal(user.dailyGoal, user.wcDaily)) {
                user.dailyStreak += 1
            }
            else {
                user.dailyStreak = 0
            }

            user.save()
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
    } catch (err: Error | any) {
        logger.error(err)
    }
})

logger.info('Startup completed.')