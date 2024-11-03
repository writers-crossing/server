import { User } from './entities'

import { Op } from 'sequelize'

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