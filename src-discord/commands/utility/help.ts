declare module "discord.js" {
    export interface Client {
        commands: Collection<unknown, any>
    }
}

import { ChatInputCommandInteraction, Collection, SlashCommandBuilder } from 'discord.js'

export const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Gets help with the bot including command list.')

export async function execute(interaction: ChatInputCommandInteraction) {
    const commands = interaction.client.commands
                        .filter(x => x.data.name != 'recalculate-user-stats')
                        .filter(x => x.data.name != 'award-xp')
                        .map(x => `\`/${x.data.name}\` - ${x.data.description}`)

    await interaction.reply({
        content: `Here are a list of available commands.\n\n${commands.join('\n')}`,
        ephemeral: true
    })
}