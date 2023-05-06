import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { getEntityUserFromDiscordUser } from '../../app/database'

export const data = new SlashCommandBuilder()
    .setName('set-goal')
    .setDescription('Sets your daily / monthly goal.')
    .addStringOption(x => x.setName('type').setDescription('Daily or Monthly').setRequired(true).addChoices({ name: 'Daily', value: 'daily' }, { name: 'Monthly', value: 'monthly' }))
    .addNumberOption(x => x.setName('goal').setDescription('Word count number').setRequired(true).setMinValue(0))

export async function execute(interaction: ChatInputCommandInteraction) {
    const typeParameter = interaction.options.getString('type')
    const goalParameter = interaction.options.getNumber('goal')

    const user = await getEntityUserFromDiscordUser(interaction.user.id, interaction.user.username, interaction.user.avatar)

    if (typeParameter == 'daily') {
        await user.update({ dailyGoal: goalParameter })
    } else if (typeParameter == 'monthly') {
        await user.update({ monthlyGoal: goalParameter })
    } else {
        throw new Error('Invalid type parameter.')
    }

    await interaction.reply(`You have updated your ${typeParameter} goal to ${goalParameter}.`)
}