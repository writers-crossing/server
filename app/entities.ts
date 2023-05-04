import { DataTypes, Model } from 'sequelize'
import sequelize from './sequelize'
import { writeFileSync } from 'node:fs'
import axios from 'axios'
import logger from './logger'

export class User extends Model {
    public id!: string
    public name!: string
    public discordId!: string
    public discordUsername!: string
    public discordAvatar!: string
    public wcDaily!: number
    public wcMonthly!: number
    public wcYearly!: number
    public wcTotal!: number

    public isInactive!: boolean
    public isHidden!: boolean

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
        wcMonthly: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false },
        wcYearly: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false },
        wcTotal: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false },

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

User.hasMany(Sprint, { foreignKey: 'createdBy' })
Sprint.belongsTo(User, { foreignKey: 'createdBy' })

User.hasMany(Sprint, { foreignKey: 'winnerId' })
Sprint.belongsTo(User, { foreignKey: 'winnerId' })

Sprint.hasMany(WcEntry, { foreignKey: 'sprintId' })
WcEntry.belongsTo(Sprint, { foreignKey: 'sprintId' })