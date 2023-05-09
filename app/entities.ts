import { Sequelize, DataTypes, Model } from 'sequelize'
import { writeFileSync } from 'node:fs'
import axios from 'axios'
import logger from './logger'
import config from '../data/config.json'

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.databaseAbsolutePath,
    logging: (msg) => {
        if (msg.startsWith('Executing')) {
            logger.debug(msg);
        } else if (msg.startsWith('Executed')) {
            logger.info(msg);
        } else if (msg.startsWith('Error')) {
            logger.error(msg);
        } else {
            logger.verbose(msg);
        }
    }
})

export default sequelize

export class Badge extends Model {
    public id!: string
    public name!: string
    public icon!: string
    public hexdecimalColor!: string
    public description!: string
    public xp!: number
}

Badge.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        icon: {
            type: DataTypes.STRING,
            allowNull: false
        },
        hexdecimalColor: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false
        },
        xp: {
            type: DataTypes.NUMBER,
            allowNull: false
        }
    },
    {
        sequelize,
        modelName: 'Badges',
    }
)

export class UserBadges extends Model {
    public userId!: string
    public badgeId!: string

    public processed!: boolean

    public readonly createdAt!: Date
    public readonly updatedAt!: Date
}

UserBadges.init({},
    {
        sequelize,
        tableName: 'UserBadges',
    }
)

export class AwardXp extends Model {
    public id!: string
    public discordId!: string
    public type!: string
    public xp!: number
    public silent!: boolean
    public processed!: boolean
}

AwardXp.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        discordId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING,
            allowNull: true
        },
        xp: {
            type: DataTypes.NUMBER,
            allowNull: false
        },
        silent: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
        processed: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false }
    },
    {
        sequelize,
        modelName: 'AwardXp',
    }
)

export class DiscordMessageLog extends Model {
    public id!: string
    public channelId!: string
    public message!: string
    public processed!: boolean
}

DiscordMessageLog.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        channelId: { type: DataTypes.STRING, allowNull: false },
        message: { type: DataTypes.STRING, allowNull: false },
        processed: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false }
    },
    {
        sequelize,
        modelName: 'DiscordMessageLog',
    })

export class User extends Model {
    public id!: string
    public name!: string
    public discordId!: string
    public discordUsername!: string
    public discordAvatar!: string

    public wcDaily!: number
    public wcWeekly!: number
    public wcMonthly!: number
    public wcYearly!: number
    public wcTotal!: number

    public dailyStreak!: number

    public dailyGoal?: number
    public weeklyGoal?: number
    public monthlyGoal?: number
    public yearlyGoal?: number

    public isInactive!: boolean
    public isHidden!: boolean

    public readonly badges?: Badge[];
    public readonly sprints?: Sprint[];
    public readonly sprintsWon?: Sprint[];
    public readonly wcEntries?: WcEntry[];

    public readonly createdAt!: Date
    public readonly updatedAt!: Date
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING, allowNull: false },
        discordId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        discordUsername: { type: DataTypes.STRING, allowNull: false },
        discordAvatar: { type: DataTypes.STRING, allowNull: true },

        wcDaily: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false },
        wcWeekly: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false },
        wcMonthly: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false },
        wcYearly: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false },
        wcTotal: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false },

        dailyStreak: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false },

        dailyGoal: { type: DataTypes.NUMBER, allowNull: true },
        weeklyGoal: { type: DataTypes.NUMBER, allowNull: true },
        monthlyGoal: { type: DataTypes.NUMBER, allowNull: true },
        yearlyGoal: { type: DataTypes.NUMBER, allowNull: true },

        isInactive: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
        isHidden: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false }
    },
    {
        sequelize,
        modelName: 'Users',
    }
)

export async function downloadUserAvatar(user: User) {
    if (user.discordAvatar) {
        const response = await axios.get(`https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png`, { responseType: 'arraybuffer' })
        const bufferWrite = Buffer.from(response.data)

        writeFileSync(`../data/avatars/${user.id}.png`, bufferWrite)
        logger.info(`Downloaded ${user.name}'s avatar to local filesystem.`)
    }
}

User.afterCreate(async (user) => {
    if (user.discordAvatar) await downloadUserAvatar(user)
})
User.afterUpdate(async (user) => {
    if (user.changed('discordAvatar')) await downloadUserAvatar(user);
})

export class Sprint extends Model {
    public id!: string
    public name!: string
    public length!: number
    public startTime!: Date
    public endTime!: Date
    public ended!: boolean

    public winnerId?: string

    public readonly createdAt!: Date
    public readonly updatedAt!: Date
}

Sprint.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING, allowNull: false },
        length: { type: DataTypes.NUMBER, allowNull: false },
        startTime: { type: DataTypes.DATE, allowNull: false },
        endTime: { type: DataTypes.DATE, allowNull: false },
        ended: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    },
    {
        sequelize,
        modelName: 'Sprints',
    }
)

export class WcEntry extends Model {
    public id!: string
    public timestamp!: Date
    public wordCount!: number
    public project?: string

    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    // References
    public userId!: string
    public sprintId!: string

    public readonly user!: User
    public readonly sprint?: Sprint
}

WcEntry.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        timestamp: { type: DataTypes.DATE, allowNull: false },
        wordCount: { type: DataTypes.NUMBER, allowNull: false },
        project: { type: DataTypes.STRING, allowNull: true },
    },
    {
        sequelize,
        modelName: 'WcEntries',
    }
)

User.hasMany(WcEntry, { foreignKey: 'userId' })
WcEntry.belongsTo(User, { foreignKey: 'userId' })

User.belongsToMany(Badge, {
    through: 'UserBadges',
    foreignKey: 'userId',
    otherKey: 'badgeId',
})

Badge.belongsToMany(User, {
    through: 'UserBadges',
    foreignKey: 'badgeId',
    otherKey: 'userId',
})

User.hasMany(Sprint, { foreignKey: 'createdBy' })
Sprint.belongsTo(User, { foreignKey: 'createdBy' })

User.hasMany(Sprint, { foreignKey: 'winnerId' })
Sprint.belongsTo(User, { foreignKey: 'winnerId' })

Sprint.hasMany(WcEntry, { foreignKey: 'sprintId' })
WcEntry.belongsTo(Sprint, { foreignKey: 'sprintId' })