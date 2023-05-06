import { ChatInputCommandInteraction, GuildMember, PermissionFlagsBits, SlashCommandBuilder, User } from 'discord.js'
import { awardXp } from '../../discord-commands'

export const data = new SlashCommandBuilder()
    .setName('award-xp')
    .setDescription('Awards XP via the AwardXp table.')
    .addMentionableOption(x => x.setName('user').setDescription('User').setRequired(true))
    .addNumberOption(x => x.setName('xp').setDescription("XP to award").setMinValue(0).setRequired(true))
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

export async function execute(interaction: ChatInputCommandInteraction) {
    const userMentionedParameter = interaction.options.getMentionable('user') as any ?? null
    const xp = interaction.options.getNumber('xp')

    if (userMentionedParameter && userMentionedParameter instanceof GuildMember == false) {
        await interaction.reply({
            content: 'Please mention a valid user.',
            ephemeral: true
        })
    }

    const userDiscordObject = userMentionedParameter.user as User
    await awardXp(interaction.client, userDiscordObject.id, xp ?? 0)

    await interaction.reply({
        content: `Awarded ${userDiscordObject} ${xp} XP.`,
        ephemeral: true
    })
}