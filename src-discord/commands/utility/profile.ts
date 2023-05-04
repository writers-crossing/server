import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import config from '../../../data/config.json'
import { getEntityUserFromDiscordUser } from '../../app/database'

export const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Get a link to your Writer\'s Crossing profile.')

export async function execute(interaction: ChatInputCommandInteraction) {
    const user = await getEntityUserFromDiscordUser(interaction.user.id, interaction.user.username, interaction.user.avatar)

    await interaction.reply({
        content: `Your profile is located at <${config.baseUrl}/users/${user.id}>`,
        ephemeral: true
    })
}