// https://discord.com/api/oauth2/authorize?client_id=1102814795012522024&permissions=58272035371840&scope=bot%20applications.commands
// https://discord.com/api/oauth2/authorize?client_id=1102699152770605087&permissions=58272035371840&scope=bot%20applications.commands

declare module "discord.js" {
    export interface Client {
        commands: Collection<unknown, any>
    }
}

import logger from './app/logger'

import { Client, Events, GatewayIntentBits, Collection, ChannelType } from 'discord.js'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import cron from 'node-cron'

import config from '../data/config.json'
import { AwardXp, DiscordMessageLog, Sprint } from './app/entities'
import { awardXp } from './discord-commands'

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

(async () => {
    // Load all commands.
    client.commands = new Collection()

    const foldersPath = join(__dirname, 'commands')
    const commandFolders = readdirSync(foldersPath)

    for (const folder of commandFolders) {
        const commandsPath = join(foldersPath, folder);
        const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
        for (const file of commandFiles) {
            const filePath = join(commandsPath, file);
            const command = await import(filePath)
            // Set a new item in the Collection with the key as the command name and the value as the exported module
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            } else {
                logger.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }

    // Respond to commands.
    client.on(Events.InteractionCreate, async interaction => {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName)

        if (!command) {
            logger.error(`No command matching ${interaction.commandName} was found.`)
            return;
        }

        try {
            logger.info(`${interaction.user.username} executed command /${interaction.commandName} ${JSON.stringify(interaction.options.data.map(x => x.value))}`)
            await command.execute(interaction)
        } catch (error) {
            logger.error(error);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true })
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
            }
        }
    })

    const [sprintsTerminatedAffectedCount] = await Sprint.update({ ended: true }, { where: { ended: false } })
    if (sprintsTerminatedAffectedCount > 0) {
        logger.warn(`Cleared ${sprintsTerminatedAffectedCount} sprints that were terminated midway.`)
    }

    client.once(Events.ClientReady, c => {
        logger.info(`Discord Ready! Logged in as ${c.user.tag}`)
    })

    client.login(config.discordToken)
})()


cron.schedule('* * * * *', async () => {
    const pendingXp = await AwardXp.findAll({ where: { processed: false } })
    if (pendingXp.length === 0) { return }

    const crosstalkChannel = client.channels.cache.get(config.discordBotCrosstalkChannelId)
    if (!crosstalkChannel || crosstalkChannel.type !== ChannelType.GuildText) {
        throw new Error('Invalid discordBotCrosstalkChannelId was provided.')
    }
    
    for (const xp of pendingXp) {
        await awardXp(client, xp.discordId, xp.xp)

        crosstalkChannel.send(`!give-xp <@${xp.discordId}> ${xp.xp}`)
        logger.info(`Gave discord user ${xp.discordId} +${xp.xp} xp.`)

        xp.processed = true
        xp.save()
    }
})

cron.schedule('* * * * *', async () => {
    const messageLog = await DiscordMessageLog.findAll({ where: { processed: false } })
    if (messageLog.length === 0) { return }
    
    for (const log of messageLog) {
        const channel = client.channels.cache.get(log.channelId)
        if (channel && channel.type === ChannelType.GuildText) {
            channel.send(log.message)
        }

        logger.info(`DiscordMessageLog (${log.id}) ${log.message.replace('\n', '')}`)

        log.processed = true
        log.save()
    }
})