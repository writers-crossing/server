import { SlashCommandBuilder } from 'discord.js'
import { formatWc } from '../../app/business.js'
import { getUser, WcEntry, recalculateUserStats, getActiveSprint } from '../../app/database.js'

export const data = new SlashCommandBuilder()
	.setName('add-wc')
	.setDMPermission(false)
	.setDescription('Adds word count to your total.')
	.addNumberOption(x => x.setName('wordcount').setDescription('word count you would like to record').setMinValue(0).setMaxValue(50000).setRequired(true))
	.addStringOption(x => x.setName('project').setDescription('project name').setRequired(false))

export async function execute(interaction) {
	const user = await getUser(interaction.user.id, interaction.user.username, interaction.member.displayName ?? interaction.user.username)
	const wordCount = interaction.options.getNumber('wordcount')
	let project = interaction.options.getString('project')
	let sprintId = null

	if (project && project.toLowerCase().startsWith("sprint")) {
		// Determine if there is a sprint and count it towards that.
		const sprint = await getActiveSprint()

		if (!sprint) {
			await interaction.reply(`There is no sprint active right now, you cannot submit WC to a sprint.`);
			return;
		}

		const now = Date.now()
		const endTime = sprint.endTime.getTime()
		const endTimePlus10 = endTime + 10 * 60 * 1000

		if (now < endTime || now > endTimePlus10) {
			await interaction.reply(`It's not time yet to submit yet for the active sprint, ${sprint.name}.\nPlease wait until after the sprint ends.`);
			return;
		}

		project = null;
		sprintId = sprint.id;
	}

	await WcEntry.create({
		timestamp: Date.now(),
		wordCount: wordCount,
		project: project,
		sprintId: sprintId,
		userId: user.id
	})

	await recalculateUserStats(user.id)

	await user.reload()

	if (sprintId) {
		await interaction.reply(`Your contribution to the sprint has been recorded, ${interaction.user}!`)
	} else {
		await interaction.reply(`Thanks for your contribution ${interaction.user}!\nYour total word count for the day is ${formatWc(user.wcDaily)}.`)
	}
}