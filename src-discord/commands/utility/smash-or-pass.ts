import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

export const data = new SlashCommandBuilder()
    .setName('smash-or-pass')
    .setDescription('Who does the bot want to smash?')

export async function execute(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id === '158972915986071553') {
        await interaction.reply({
            content: `I'd smash.`,
            ephemeral: true
        })

        return;
    }

    await interaction.reply({
        content: `Pass.`,
        ephemeral: true
    })
}