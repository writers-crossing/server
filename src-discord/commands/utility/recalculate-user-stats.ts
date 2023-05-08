import { ChatInputCommandInteraction, GuildMember, PermissionFlagsBits, SlashCommandBuilder, User } from 'discord.js'
import { getEntityUserByDiscordId, recalculateUserMetrics as recalculateUserStats } from '../../app/database'

export const data = new SlashCommandBuilder()
    .setName('recalculate-user-stats')
    .setDescription('Recalculates a users statistics.')
    .addMentionableOption(x => x.setName('user').setDescription('User').setRequired(true))
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)

export async function execute(interaction: ChatInputCommandInteraction) {
    const userMentionedParameter = interaction.options.getMentionable('user') as any ?? null

    if (userMentionedParameter && userMentionedParameter instanceof GuildMember == false) {
        await interaction.reply({
            content: 'Please mention a valid user.',
            ephemeral: true
        })
    }

    const userDiscordObject = userMentionedParameter.user as User
    const user = await getEntityUserByDiscordId(userDiscordObject.id)
    if (!user) throw new Error('User not found.')

    await recalculateUserStats(user.id)

    await interaction.reply({
        content: `Recalculated user stats for ${userDiscordObject}.`,
        ephemeral: true
    })
}