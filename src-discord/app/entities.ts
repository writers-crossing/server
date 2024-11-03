import { Sequelize, DataTypes, Model } from 'sequelize'
import { writeFileSync } from 'node:fs'
import axios from 'axios'
import logger from './logger'
import config from '../../data/config.json'

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: config.databaseHost,
    port: config.databasePort,
    database: config.databaseName,
    username: config.databaseUser,
    password: config.databasePassword,
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
            field: 'Id'
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'Name'
        },
        icon: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'Icon'
        },
        hexdecimalColor: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'HexdecimalColor'
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
            field: 'Description'
        },
        xp: {
            type: DataTypes.NUMBER,
            allowNull: false,
            field: 'Xp'
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

    public user!: User
    public badge!: Badge

    public processed!: boolean

    public readonly createdAt!: Date
    public readonly updatedAt!: Date
}

UserBadges.init(
    {
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            field: 'UserId',
            references: {
                model: 'User',
                key: 'Id',
            },
        },
        badgeId: {
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            field: 'BadgeId',
            references: {
                model: 'Badge',
                key: 'Id',
            },
        },
        processed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            field: 'Processed'
        },
    },
    {
        sequelize,
        tableName: 'UserBadges',
    }
)

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

    public readonly badges?: UserBadges[];
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
            field: 'Id'
        },
        name: { type: DataTypes.STRING, allowNull: false, field: 'Name' },
        discordId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            field: 'DiscordId'
        },
        discordUsername: { type: DataTypes.STRING, allowNull: false, field: 'DiscordUsername' },
        discordAvatar: { type: DataTypes.STRING, allowNull: true, field: 'DiscordAvatar' },

        wcDaily: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false, field: 'WcDaily' },
        wcWeekly: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false, field: 'WcWeekly' },
        wcMonthly: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false, field: 'WcMonthly' },
        wcYearly: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false, field: 'WcYearly' },
        wcTotal: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false, field: 'WcTotal' },

        dailyStreak: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false, field: 'DailyStreak' },

        dailyGoal: { type: DataTypes.NUMBER, allowNull: true, field: 'DailyGoal' },
        weeklyGoal: { type: DataTypes.NUMBER, allowNull: true, field: 'WeeklyGoal' },
        monthlyGoal: { type: DataTypes.NUMBER, allowNull: true, field: 'MonthlyGoal' },
        yearlyGoal: { type: DataTypes.NUMBER, allowNull: true, field: 'YearlyGoal' },

        isInactive: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, field: 'IsInactive' },
        isHidden: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, field: 'IsHidden' }
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

export class Marathon extends Model {
    public id!: string
    public name!: string
    public slug!: string
    public startTime!: Date
    public endTime!: Date
}

Marathon.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
            field: 'Id'
        },
        name: { type: DataTypes.STRING, allowNull: false, field: 'Name' },
        slug: { type: DataTypes.STRING, allowNull: false, field: 'Slug' },
        startTime: { type: DataTypes.DATE, allowNull: false, field: 'StartTime' },
        endTime: { type: DataTypes.DATE, allowNull: false, field: 'EndTime' }
    },
    {
        sequelize,
        modelName: 'Marathons',
    }
)

export class WcEntry extends Model {
    public id!: string
    public timestamp!: Date
    public wordCount!: number
    public project?: string
    public for?: string

    public readonly createdAt!: Date
    public readonly updatedAt!: Date

    // References
    public userId!: string
    public readonly user!: User
}

WcEntry.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            primaryKey: true,
            field: 'Id'
        },
        timestamp: { type: DataTypes.DATE, allowNull: false, field: 'Timestamp' },
        wordCount: { type: DataTypes.NUMBER, allowNull: false, field: 'WordCount' },
        project: { type: DataTypes.STRING, allowNull: true, field: 'Project' },
        for: { type: DataTypes.STRING, allowNull: true, field: 'For' },
    },
    {
        sequelize,
        modelName: 'WcEntries',
    }
)

User.hasMany(WcEntry, { foreignKey: 'UserId' })
WcEntry.belongsTo(User, { foreignKey: 'UserId' })

UserBadges.belongsTo(Badge, { foreignKey: 'BadgeId' })
UserBadges.belongsTo(User, { foreignKey: 'UserId' })
