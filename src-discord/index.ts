process.env.TZ = 'America/New_York'

// https://discord.com/api/oauth2/authorize?client_id=1102814795012522024&permissions=58272035371840&scope=bot%20applications.commands
// https://discord.com/api/oauth2/authorize?client_id=1102699152770605087&permissions=58272035371840&scope=bot%20applications.commands

declare module "discord.js" {
    export interface Client {
        commands: Collection<unknown, any>
    }
}

import logger from './app/logger'

import cron from 'node-cron'
import { Client, Events, GatewayIntentBits, Collection, ChannelType, User } from 'discord.js'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import config from '../data/config.json'
import { Sprint, UserBadges } from './app/entities'

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function processBadges() {
    const badgesToProcess = await UserBadges.findAll({
        where: { processed: false },
        include: [{ all: true }]
    })

    if (badgesToProcess.length === 0) { return }

    const studyHallChannel = client.channels.cache.get(config.discordStudyHallId)
    if (!studyHallChannel || studyHallChannel.type !== ChannelType.GuildText) {
        throw new Error('Invalid discordStudyHallId was provided.')
    }

    for (const userBadge of badgesToProcess) {
        try {
            await studyHallChannel.send(`<@${userBadge.user.discordId}> has been awarded the ${userBadge.badge.name}!`)

            userBadge.processed = true
            userBadge.save()

            logger.info(`Processed user badge ${userBadge.badge.id} for user ${userBadge.user.id}. Awarded ${userBadge.user.name} the badge ${userBadge.badge.name}.`)
        } catch (err: Error | any) {
            logger.error(`Unable to process badge ${userBadge.badge?.id} for user ${userBadge.user?.id}. ${err?.message}`, { err: err })
        }
    }
}

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

    client.once(Events.ClientReady, async c => {
        logger.info(`Discord Ready! Logged in as ${c.user.tag}`)

        // await processBadges()

        /*
        cron.schedule('* * * * *', async () => {
            try {
                await processBadges()
            } catch (err: Error | any) {
                logger.error(err)
            }
        })
        */
    })

    client.login(config.discordToken)
})()