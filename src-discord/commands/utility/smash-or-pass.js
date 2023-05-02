import { SlashCommandBuilder } from 'discord.js'

export const data = new SlashCommandBuilder()
    .setName('smash-or-pass')
    .setDescription('Who does the bot want to smash?')

export async function execute(interaction) {
    if (interaction.user.id === '158972915986071553') {
        await interaction.reply('I\'d smash.');
        return;
    }

    await interaction.reply('Pass.')
}