import sequelize from './entities'
import { Sprint, WcEntry, User } from './entities'

import { Op, QueryTypes } from 'sequelize'

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

export const recalculateUserMetrics = async (userId: string) => {
    const user = await User.findOne({ where: { id: userId } })
    if (user == null) {
        throw new Error(`Cannot find user with id of ${userId}.`)
    }

    let now = new Date()
    let day = now.getDay()
    let year = now.getFullYear()
    let month = now.getMonth()

    const date = new Date(year, month, day)
    const dayOfWeek = date.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const firstDayOfWeek = new Date(year, month, day - diff)
    const lastDayOfWeek = new Date(year, month, day + (6 - diff))
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const firstDayOfYear = new Date(year, 0, 1)
    const lastDayOfYear = new Date(year + 1, 0, 0)

    const entries = await WcEntry.findAll({
        where: {
            userId: user.id,
            timestamp: {
                [Op.gte]: new Date(year, 0, 1, 0, 0, 0, 0)
            }
        }
    })

    const wcDaily = entries
        .filter(entry => new Date(entry.timestamp.getFullYear(), entry.timestamp.getMonth(), entry.timestamp.getDay()) === date)
        .reduce((sum, entry) => sum + entry.wordCount, 0)

    const wcWeekly = entries
        .filter(entry => new Date(entry.timestamp) >= firstDayOfWeek &&
                         new Date(entry.timestamp) <= lastDayOfWeek)
        .reduce((sum, entry) => sum + entry.wordCount, 0)

    const wcMonthly = entries
        .filter(entry => new Date(entry.timestamp) >= firstDayOfMonth &&
                         new Date(entry.timestamp) <= lastDayOfMonth)
        .reduce((sum, entry) => sum + entry.wordCount, 0)

    const wcYearly = entries
        .filter(entry => new Date(entry.timestamp) >= firstDayOfYear &&
                         new Date(entry.timestamp) <= lastDayOfYear)
        .reduce((sum, entry) => sum + entry.wordCount, 0)

    const wcTotal = await WcEntry.sum('wordCount', { where: { userId: userId } }) ?? 0

    await user.update({
        wcDaily: wcDaily,
        wcWeekly: wcWeekly,
        wcMonthly: wcMonthly,
        wcYearly: wcYearly,
        wcTotal: wcTotal
    })
}

export const getSprintWinner = async (sprintId: string) => {
    let winnerLeaderboard = await getSprintLeaderboard(sprintId, 1)
    let winnerUserId = (winnerLeaderboard[0] as any)['user_id'] as string | null

    if (winnerUserId) {
        return await User.findOne({ where: { id: winnerUserId } })
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
        replacements: [sprintId, limit],
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