// https://discord.com/api/oauth2/authorize?client_id=1102699152770605087&permissions=8&scope=bot%20applications.commands

import { initialize as database_initialize } from './app/database.js'

// Require the necessary discord.js classes
import { Client, Events, GatewayIntentBits, Collection } from 'discord.js'
import { readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import config from '../data/config.json' assert { type: "json" }

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] })

// Load all commands.
client.commands = new Collection();
const foldersPath = join(__dirname, 'commands');
const commandFolders = readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = join(foldersPath, folder);
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        const command = await import(filePath)
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Respond to commands.
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName)

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`)
        return;
    }

    try {
        await command.execute(interaction)
    } catch (error) {
        console.error(error);

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true })
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
        }
    }
})

client.once(Events.ClientReady, c => {
    console.log(`Discord Ready! Logged in as ${c.user.tag}`)
});

await database_initialize()

client.login(config.discordToken)