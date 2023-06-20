import config from '../../../data/config.json'

import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { formatWc } from '../../app/business'
import { Sprint, WcEntry } from '../../app/entities'
import { getEntityUserFromDiscordUser, getActiveSprint } from '../../app/database'
import logger from '../../app/logger'
import { store } from '../../store'

export const data = new SlashCommandBuilder()
	.setName('add-wc')
	.setDMPermission(false)
	.setDescription('Adds word count to your total.')
	.addNumberOption(x => x.setName('wordcount').setDescription('word count you would like to record').setMinValue(1).setMaxValue(50000).setRequired(true))
	.addStringOption(x => x.setName('project').setDescription('project name').setRequired(false))
	.addStringOption(x => x.setName('for')
		.setDescription('what to contribute towards')
		.addChoices({ name: 'Sprint', value: 'sprint' }, { name: 'Timer', value: 'timer' })
		.setRequired(false))

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
	const project = interaction.options.getString('project')
	const addFor = interaction.options.getString('for')?.toLowerCase() ?? null

	let activeSprint = await getActiveSprint()
	let activeTimer = store.timers.get(interaction.user.id) ?? null
	let sprint: Sprint | null = null

	if (addFor) {
		if (addFor === 'sprint') {
			// Determine if there is a sprint and count it towards that.
			if (activeSprint === null) {
				await interaction.reply({
					content: 'There is no sprint active right now, you cannot submit WC.',
					ephemeral: true
				})

				return
			}

			const now = Date.now()
			const endTime = activeSprint.endTime.getTime()
			const endTimePlus10 = endTime + 10 * 60 * 1000

			if (now < endTime || now > endTimePlus10) {
				await interaction.reply({
					content: 'It is not time yet to submit yet for the sprint. Please wait until after the sprint ends.',
					ephemeral: true
				})

				return
			}

			sprint = activeSprint
		} else if (addFor === 'timer') {
			// Determine if there is a timer and count it towards that.
			if (activeTimer === null) {
				await interaction.reply({
					content: 'There is no timer active right now, you cannot submit WC.',
					ephemeral: true
				})

				return
			}

			if (activeTimer?.ended == false) {
				await interaction.reply({
					content: 'It is not time yet to submit yet for the timer. Please wait until after the timer ends.',
					ephemeral: true
				})

				return
			}
		} else {
			await interaction.reply({
				content: 'You did not supply a correct "for" method',
				ephemeral: true
			})

			return
		}
	}

	const wcEntry = await WcEntry.create({
		timestamp: Date.now(),
		wordCount: wordCount,
		project: project,
		for: addFor?.toLowerCase() ?? null,
		sprintId: sprint?.id,
		userId: user.id
	})

	user.wcDaily += wordCount
	user.wcWeekly += wordCount
	user.wcMonthly += wordCount
	user.wcYearly += wordCount
	user.wcTotal += wordCount

	await user.save()

	if (addFor === 'sprint' && sprint) {
		logger.info(`${interaction.user.username}/${interaction.user.id} contributed ${wcEntry.wordCount} words to sprint ${sprint.id}.`)
		await interaction.reply(`${interaction.user} has contributed to the sprint.`)
	} else if (addFor === 'timer') {
		logger.info(`${interaction.user.username}/${interaction.user.id} contributed ${wcEntry.wordCount} words to timer. Their current total for the day is ${formatWc(user.wcDaily)} words.`)
		await interaction.reply(`${interaction.user} has contributed to their timer.\nTheir current total for the day is ${formatWc(user.wcDaily)} words.`)

		store.timers.set(interaction.user.id, null)
	} else {
		logger.info(`${interaction.user.username}/${interaction.user.id} contributed ${wcEntry.wordCount} words. Their current total for the day is ${formatWc(user.wcDaily)} words.`)
		await interaction.reply(`${interaction.user} has added to their daily word count.\nTheir current total for the day is ${formatWc(user.wcDaily)} words.`)
	}
}