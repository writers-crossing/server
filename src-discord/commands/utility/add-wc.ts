import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { formatWc } from '../../app/business'
import { Sprint, WcEntry } from '../../app/entities'
import { getEntityUserFromDiscordUser, recalculateUserStats, getActiveSprint } from '../../app/database'
import logger from '../../app/logger'

export const data = new SlashCommandBuilder()
	.setName('add-wc')
	.setDMPermission(false)
	.setDescription('Adds word count to your total.')
	.addNumberOption(x => x.setName('wordcount').setDescription('word count you would like to record').setMinValue(0).setMaxValue(50000).setRequired(true))
	.addStringOption(x => x.setName('project').setDescription('project name').setRequired(false))

export async function execute(interaction: ChatInputCommandInteraction) {
	const user = await getEntityUserFromDiscordUser(interaction.user.id, interaction.user.username, interaction.user.avatar)
	const wordCount = Math.floor(interaction.options.getNumber('wordcount') ?? 0)
	let project = interaction.options.getString('project')

	let activeSprint  = await getActiveSprint()
	let sprint: Sprint | null = null

	if (project && project.toLowerCase().startsWith("sprint")) {
		// Determine if there is a sprint and count it towards that.
		if (!activeSprint) {
			await interaction.reply(`There is no sprint active right now, you cannot submit WC to a sprint.`);
			return;
		}

		const now = Date.now()
		const endTime = activeSprint.endTime.getTime()
		const endTimePlus10 = endTime + 10 * 60 * 1000

		if (now < endTime || now > endTimePlus10) {
			await interaction.reply(`It's not time yet to submit yet for the sprint. Please wait until after the sprint ends.`);
			return;
		}

		project = null
		sprint = activeSprint
	}

	const wcEntry = await WcEntry.create({
		timestamp: Date.now(),
		wordCount: wordCount,
		project: project,
		sprintId: sprint?.id,
		userId: user.id
	})

	await recalculateUserStats(user.id)

	await user.reload()

	if (sprint) {
		logger.info(`${interaction.user.username}/${interaction.user.id} contributed ${wcEntry.wordCount} words to sprint ${sprint.id}.`)
		await interaction.reply(`Your contribution to the sprint has been recorded, ${interaction.user}!`)
	} else {
		logger.info(`${interaction.user.username}/${interaction.user.id} contributed ${wcEntry.wordCount} words.`)
		await interaction.reply(`Thanks for your contribution ${interaction.user}!\nYour total word count for the day is ${formatWc(user.wcDaily)}.`)
	}
}