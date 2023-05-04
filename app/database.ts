import logger from './logger'
import sequelize from './sequelize'
import { Sprint, WcEntry, User } from './entities'

import { Sequelize, Op } from 'sequelize'

export const initialize = async () => {
    await sequelize.sync({ force: false, alter: false })

    const [sprintsTerminatedAffectedCount] = await Sprint.update({ ended: true }, { where: { ended: false } })
    if (sprintsTerminatedAffectedCount > 0) {
        logger.warn(`Cleared ${sprintsTerminatedAffectedCount} sprints that were terminated midway.`)
    }

    logger.info('Database Ready!')
}

export const getEntityUserFromDiscordUser = async (discordId: string, discordUsername: string, discordAvatarHash: string | null) => {
    let user = await User.findOne({ where: { discordId: discordId } })

    if (user) {
        user = await user.update({
            discordUsername: discordUsername,
            discordAvatarHash: discordAvatarHash
        })
    } else {
        user = await User.create({
            discordId: discordId,
            discordUsername: discordUsername,
            discordAvatarHash: discordAvatarHash
        })
    }

    return user
}

export const getActiveSprint = async () => {
    return await Sprint.findOne({
        where: {
            ended: false
        }
    })
}

export const calculateWinnerForSprint = async (sprintId: string) => {
    const result = await WcEntry.findOne({
        where: { sprintId },
        attributes: ['userId', [Sequelize.fn('sum', Sequelize.col('wordCount')), 'totalWordCount']],
        include: [User],
        group: ['userId'],
        order: [[Sequelize.literal('totalWordCount'), 'DESC']],
        limit: 1
    })

    return result?.User
}

export const addWordCount = async (userId: string, wordCount: number, project: string) => {
    await WcEntry.create({
        timestamp: Date.now(),
        wordCount: wordCount,
        project: project,
        userId: userId
    })

    await recalculateUserStats(userId)
}

export const recalculateUserStats = async (userId: string) => {
    let user = await User.findOne({ where: { id: userId } })

    if (user == null) {
        throw new Error(`Cannot find user with id of ${userId}.`)
    }

    let now = new Date()
    let day = now.getDay()
    let year = now.getFullYear()
    let month = now.getMonth()

    const wcDaily = await WcEntry.sum('wordCount', {
        where: {
            userId: userId,
            timestamp: {
                [Op.gte]: new Date(year, month, day),
                [Op.lt]: new Date(year, month, day + 1),
            }
        }
    }) ?? 0

    const wcMonthly = await WcEntry.sum('wordCount', {
        where: {
            userId: userId,
            timestamp: {
                [Op.gte]: new Date(year, month, 1),
                [Op.lt]: new Date(year, month, 31),
            }
        }
    }) ?? 0

    const wcYearly = await WcEntry.sum('wordCount', {
        where: {
            userId: userId,
            timestamp: {
                [Op.gte]: new Date(year, 1, 1),
                [Op.lt]: new Date(year, 12, 31),
            }
        }
    }) ?? 0

    const wcTotal = await WcEntry.sum('wordCount', {
        where: {
            userId: userId
        }
    }) ?? 0

    await user.update({
        wcDaily: wcDaily,
        wcMonthly: wcMonthly,
        wcYearly: wcYearly,
        wcTotal: wcTotal
    })
}