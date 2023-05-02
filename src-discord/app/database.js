import { Sequelize, DataTypes } from 'sequelize'

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './../data/database.sqlite'
})

export const User = sequelize.define('Users', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    discordId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    discordUsername: DataTypes.STRING,
    nickname: DataTypes.STRING,
    wcDaily: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false },
    wcMonthly: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false },
    wcYearly: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false },
    wcTotal: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false }
})

export const Sprint = sequelize.define('Sprints', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    name: { type: DataTypes.STRING, allowNull: false },
    length: { type: DataTypes.NUMBER, allowNull: false },
    startTime: { type: DataTypes.DATE, allowNull: false },
    endTime: { type: DataTypes.DATE, allowNull: false },
    ended: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false }
})

export const WcEntry = sequelize.define('WcEntries', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    timestamp: { type: DataTypes.DATE, allowNull: false },
    wordCount: { type: DataTypes.NUMBER, allowNull: false },
    project: { type: DataTypes.STRING, allowNull: true }
})

User.hasMany(WcEntry, { foreignKey: 'userId' })
WcEntry.belongsTo(User, { foreignKey: 'userId' })

User.hasMany(Sprint, { foreignKey: 'createdBy' })
Sprint.belongsTo(User, { foreignKey: 'createdBy' })

Sprint.hasMany(WcEntry, { foreignKey: 'sprintId' })
WcEntry.belongsTo(Sprint, { foreignKey: 'sprintId' })

export const initialize = async () => {
    await sequelize.sync({ force: false, alter: false })
    console.info('Database Ready!')
}

export const getUser = async (discordId, discordUsername, nickname) => {
    let user = await User.findOne({ where: { discordId: discordId } })

    if (user) {
        user = await user.update({
            discordUsername: discordUsername,
            nickname: nickname
        })
    } else {
        user = await User.create({
            discordId: discordId,
            discordUsername: discordUsername,
            nickname: nickname
        })
    }

    return user
}

export const getActiveSprint = async () => {
    return await Sprint.findOne({
      where: {
        ended: false
      }
    });
}

export const getWinnerForSprint = async(sprintId) => {
    const result = await WcEntry.findAll({
        where: { sprintId },
        attributes: ['userId', [Sequelize.fn('sum', Sequelize.col('wordCount')), 'totalWordCount']],
        include: [ User ],
        group: ['userId'],
        order: [[Sequelize.literal('totalWordCount'), 'DESC']],
        limit: 1
      });
      
      return result[0]?.User;
}

export const addWordCount = async (userId, wordCount, project) => {
    await WcEntry.create({
        timestamp: Date.now(),
        wordCount: wordCount,
        project: project,
        userId: userId
    })

    await recalculateUserStats(userId)
}

export const recalculateUserStats = async (userId) => {
    let user = await User.findOne({ where: { id: userId } })

    let now = new Date()
    let day = now.getDay()
    let year = now.getFullYear()
    let month = now.getMonth()

    const wcDaily = await WcEntry.sum('wordCount', {
        where: {
            userId: userId,
            timestamp: {
                [Sequelize.Op.gte]: new Date(year, month, day),
                [Sequelize.Op.lt]: new Date(year, month, day + 1),
            }
        }
    }) ?? 0

    const wcMonthly = await WcEntry.sum('wordCount', {
        where: {
            userId: userId,
            timestamp: {
                [Sequelize.Op.gte]: new Date(year, month, 1),
                [Sequelize.Op.lt]: new Date(year, month, 31),
            }
        }
    }) ?? 0

    const wcYearly = await WcEntry.sum('wordCount', {
        where: {
            userId: userId,
            timestamp: {
                [Sequelize.Op.gte]: new Date(year, 1, 1),
                [Sequelize.Op.lt]: new Date(year, 12, 31),
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