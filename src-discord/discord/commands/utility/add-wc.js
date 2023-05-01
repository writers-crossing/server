import { SlashCommandBuilder } from 'discord.js';
import { getUser, addWordCount } from '../../../app/database.js'

export const data = new SlashCommandBuilder()
	.setName('add-wc')
	.setDMPermission(false)
	.setDescription('Adds word count to your total.')
	.addNumberOption(x => x.setName('wordcount').setDescription('word count you would like to record').setRequired(true))
	.addStringOption(x => x.setName('project').setDescription('project name').setRequired(false))

export async function execute(interaction) {
	const user = await getUser(interaction.user.id, interaction.user.username, interaction.member.displayName ?? interaction.user.username)
	const wordCount = interaction.options.getNumber('wordcount')
	const project = interaction.options.getString('project')
	await addWordCount(user.id, wordCount, project)

	await user.reload()
	await interaction.reply(`Thanks for your submission ${interaction.user}! Your total word count for the day is ${user.wcDaily}.`)
}