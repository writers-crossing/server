import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import config from '../../../data/config.json'

export const data = new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Get a link to the leaderboards.')

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
        content: `The leaderboard can be found at <${config.baseUrl}/>`,
        ephemeral: true
    })
}