import { ChannelType, Client } from 'discord.js'
import config from '../data/config.json'
import logger from './app/logger'

export async function awardXp(client: Client<boolean>, discordId: string, xp: number) {
    const channel = client.channels.cache.get(config.discordBotCrosstalkChannelId)
    if (!channel || channel.type !== ChannelType.GuildText) {
        throw new Error('Invalid discordBotCrosstalkChannelId was provided.')
    }

    channel.send(`!give-xp <@${discordId}> ${xp}`)
    logger.info(`Gave discord user ${discordId} ${xp} xp.`)
}