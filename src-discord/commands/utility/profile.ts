import { ChatInputCommandInteraction, GuildMember, SlashCommandBuilder, User, userMention } from 'discord.js'
import config from '../../../data/config.json'
import { getEntityUserByDiscordId } from '../../app/database'

export const data = new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Get a link to a Writer\'s Crossing profile.')
    .addMentionableOption(x => x.setName('user').setDescription('User\'s profile to link.').setRequired(false))

export async function execute(interaction: ChatInputCommandInteraction) {
    const userMentionedParameter = interaction.options.getMentionable('user') as any ?? null

    if (userMentionedParameter && userMentionedParameter instanceof GuildMember == false) {
        await interaction.reply({
            content: 'Please mention a valid user.',
            ephemeral: true
        })
    }

    const userDiscordObject = userMentionedParameter?.user ?? interaction.user as User
    const userEntity = await getEntityUserByDiscordId(userDiscordObject.id)

    if (userMentionedParameter == null && userEntity == null) {
        await interaction.reply({
            content: 'You have not yet setup a profile.',
            ephemeral: true
        })

        return
    } else if (userMentionedParameter && userEntity == null) {
        await interaction.reply({
            content: `${userDiscordObject?.username ?? ''} has not yet setup a profile.`,
            ephemeral: true
        })

        return
    }

    if (userMentionedParameter && userEntity) {
        await interaction.reply({
            content: `${userEntity.discordUsername}'s profile can be found at: <${config.baseUrl}/users/${userEntity.id}>`,
            ephemeral: true
        })
    } else if (userMentionedParameter == null && userEntity) {
        await interaction.reply({
            content: `Your profile can be found at: <${config.baseUrl}/users/${userEntity.id}>`,
            ephemeral: true
        })
    }
}