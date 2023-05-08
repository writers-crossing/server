import config from '../../../data/config.json'

import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { formatWc } from '../../app/business'
import { Sprint, WcEntry } from '../../app/entities'
import { getEntityUserFromDiscordUser, recalculateUserMetrics, getActiveSprint } from '../../app/database'
import logger from '../../app/logger'

export const data = new SlashCommandBuilder()
	.setName('add-wc')
	.setDMPermission(false)
	.setDescription('Adds word count to your total.')
	.addNumberOption(x => x.setName('wordcount').setDescription('word count you would like to record').setMinValue(1).setMaxValue(50000).setRequired(true))
	.addStringOption(x => x.setName('project').setDescription('project name').setRequired(false))

export async function execute(interaction: ChatInputCommandInteraction) {
    if (interaction.channel?.id != config.discordStudyHallId) {
        await interaction.reply({
            content: `You cannot use this command outside of <#${config.discordStudyHallId}>.`,
            ephemeral: true
        })

        return
    }

	const user = await getEntityUserFromDiscordUser(interaction.user.id, interaction.user.username, interaction.user.avatar)
	const wordCount = Math.floor(interaction.options.getNumber('wordcount') ?? 0)
	let project = interaction.options.getString('project')

	let activeSprint  = await getActiveSprint()
	let sprint: Sprint | null = null

	if (project && project.toLowerCase().startsWith("sprint")) {
		// Determine if there is a sprint and count it towards that.
		if (!activeSprint) {
			await interaction.reply({
				content: 'There is no sprint active right now, you cannot submit WC to a sprint.',
				ephemeral: true
			})

			return;
		}

		const now = Date.now()
		const endTime = activeSprint.endTime.getTime()
		const endTimePlus10 = endTime + 10 * 60 * 1000

		if (now < endTime || now > endTimePlus10) {
			await interaction.reply({
				content: 'It is not time yet to submit yet for the sprint. Please wait until after the sprint ends.',
				ephemeral: true
			})

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

	user.wcDaily += wordCount
	user.wcMonthly += wordCount
	user.wcYearly += wordCount
	user.wcTotal += wordCount
	
	await user.save()

	if (sprint) {
		logger.info(`${interaction.user.username}/${interaction.user.id} contributed ${wcEntry.wordCount} words to sprint ${sprint.id}.`)
		await interaction.reply(`${interaction.user} has contributed to the sprint.`)
	} else {
		logger.info(`${interaction.user.username}/${interaction.user.id} contributed ${wcEntry.wordCount} words. Their current total for the day is ${formatWc(user.wcDaily)} words.`)
		await interaction.reply(`${interaction.user} has recorded their daily word count!\nTheir current total for the day is ${formatWc(user.wcDaily)} words.`)
	}
}