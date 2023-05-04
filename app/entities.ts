import { DataTypes, Model } from 'sequelize'
import sequelize from './sequelize'

export class User extends Model {
    public id!: string
    public discordId!: string
    public discordUsername!: string
    public discordAvatarUrl!: string
    public wcDaily!: number
    public wcMonthly!: number
    public wcYearly!: number
    public wcTotal!: number

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
        discordId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        discordUsername: { type: DataTypes.STRING, allowNull: false },
        discordAvatarUrl: { type: DataTypes.STRING, allowNull: false },
        wcDaily: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false },
        wcMonthly: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false },
        wcYearly: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false },
        wcTotal: { type: DataTypes.NUMBER, defaultValue: 0, allowNull: false },
    },
    {
        sequelize,
        modelName: 'Users',
    }
)

export class Sprint extends Model {
    public id!: string
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

    public readonly User!: User
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