import logger from './logger'
import sequelize from './sequelize'
import { Sprint, WcEntry, User } from './entities'

import { Sequelize, Op, QueryTypes } from 'sequelize'

export const initialize = async () => {
    await sequelize.sync({ force: false, alter: false })

    const [sprintsTerminatedAffectedCount] = await Sprint.update({ ended: true }, { where: { ended: false } })
    if (sprintsTerminatedAffectedCount > 0) {
        logger.warn(`Cleared ${sprintsTerminatedAffectedCount} sprints that were terminated midway.`)
    }

    logger.info('Database Ready!')
}

export const getEntityUserByDiscordId = async (x: string) => {
    return await User.findOne({ where: { discordId: x } })
}

export const getEntityUserByAny = async (x: string) => {
    return await User.findOne({
        where: {
            [Op.or]: [
                { id: x },
                { discordId: x },
                { discordUsername: x }
            ]
        }
    })
}

export const getEntityUserFromDiscordUser = async (discordId: string, discordUsername: string, discordAvatar: string | null) => {
    let user = await User.findOne({ where: { discordId: discordId } })

    if (user == null) {
        return await User.create({
            name: discordUsername,
            discordId: discordId,
            discordUsername: discordUsername,
            discordAvatar: discordAvatar
        })
    } else {
        return await user.update({
            name: discordUsername,
            discordUsername: discordUsername,
            discordAvatar: discordAvatar
        })
    }
}

export const getActiveSprint = async () => {
    return await Sprint.findOne({
        where: {
            ended: false
        }
    })
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

export const getSprintWinner = async (sprintId: string) => {
    let winnerLeaderboard = await getSprintLeaderboard(sprintId, 1)
    let winnerUserId = (winnerLeaderboard[0] as any)['user_id'] as string | null

    if (winnerUserId) {
        return await User.findOne({ where: { id: winnerUserId }})
    }

    return null
}

export const getSprintLeaderboard = async (sprintId: string, limit = 99) => {
    return await sequelize.query(`
        SELECT ROW_NUMBER() OVER (ORDER BY SUM(wordCount) DESC) AS rowNumber,
            Users.id AS user_id,
            Users.name AS user_name,
            SUM(wordCount) AS count
        FROM WcEntries
        INNER JOIN Users ON WcEntries.userId = Users.id
        WHERE sprintId = ?
        GROUP BY userId
        ORDER BY count DESC
        LIMIT ?;
    `, {
        replacements: [ sprintId, limit ],
        type: QueryTypes.SELECT
    })
}

export const getMonthLeaderboard = async (limit = 10) => {
    const users = await User.findAll({
        attributes: [
            'id',
            'name',
            'wcMonthly',
            [sequelize.literal('ROW_NUMBER() OVER (ORDER BY wcMonthly DESC)'), 'rowNumber']
        ],
        where: {
            isHidden: false
        },
        order: [['wcMonthly', 'DESC']],
        limit
    })

    return users.map(user => ({
        rowNumber: user.get('rowNumber'),
        id: user.id,
        name: user.name,
        count: user.wcMonthly
    }))
}

export const getAllTimeLeaderboard = async (limit = 10) => {
    const users = await User.findAll({
        attributes: [
            'id',
            'name',
            'wcTotal',
            [sequelize.literal('ROW_NUMBER() OVER (ORDER BY wcTotal DESC)'), 'rowNumber']
        ],
        where: {
            isHidden: false
        },
        order: [['wcTotal', 'DESC']],
        limit
    })

    return users.map(user => ({
        rowNumber: user.get('rowNumber'),
        id: user.id,
        name: user.name,
        count: user.wcTotal
    }))
}