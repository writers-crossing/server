import config from '../../../data/config.json'

import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { Sprint } from '../../app/entities'
import { getActiveSprint, getEntityUserFromDiscordUser, getSprintLeaderboard, getSprintWinner } from '../../app/database'
import { getSprintTheme, waitMinutes } from '../../app/business'
import logger from '../../app/logger'

export const data = new SlashCommandBuilder()
    .setName('start-sprint')
    .setDMPermission(false)
    .setDescription('Starts a sprint activity.')
    .addNumberOption(x => x.setName('minutes').setDescription('number of minutes the sprint will last').setMinValue(1).setMaxValue(60).setRequired(false))

export async function execute(interaction: ChatInputCommandInteraction) {
    if (await getActiveSprint() != null) {
        await interaction.reply(`You cannot start a sprint. A sprint is already active.`)
        return
    }

    if (!interaction.channel) {
        await interaction.reply(`You cannot start a sprint outside of the guild.`)
        return
    }

    const user = await getEntityUserFromDiscordUser(interaction.user.id, interaction.user.username, interaction.user.avatar)
    const sprintLengthMinutes = Math.floor(interaction.options.getNumber('minutes') ?? 20)
    const startTime = new Date(Date.now() + config.sprintPrepTimeMinutes * 60 * 1000)
    const endTime = new Date(startTime.getTime() + sprintLengthMinutes * 60 * 1000)

    const sprint = await Sprint.create({
        name: getSprintTheme(),
        createdBy: user.id,
        length: sprintLengthMinutes,
        startTime: startTime,
        endTime: endTime,
        ended: false
    })

    logger.info(`A sprint (${sprint.id}) was started by ${interaction.user}.`)

    await interaction.reply(`A sprint was started by ${interaction.user}! This sprint will last for ${sprintLengthMinutes} minutes.\nYou will have ${config.sprintPrepTimeMinutes} minutes before this sprint begins.\nGet ready!`)
    await waitMinutes(config.sprintPrepTimeMinutes)

    await interaction.channel.send(`The sprint has started!`)
    await waitMinutes(sprintLengthMinutes)

    await interaction.channel.send(`The sprint has ended!\nIn order to contribute to this sprint, you must submit word count with the project of \`sprint\`.\nPlease submit your word count now.`);
    await waitMinutes(config.sprintSubmissionTimeMinutes)

    const leaderboard = await getSprintLeaderboard(sprint.id)
    const winner = await getSprintWinner(sprint.id)

    sprint.ended = true
    sprint.winnerId = winner?.id

    await sprint.save()

    if (winner) {
        await interaction.channel.send(`Sprint has been closed for submission.\nThe winner for this sprint is <@${winner?.discordId}>!\nThe results for this sprint can be found here: <https://writers-crossing.com/sprints/${sprint.id}/>`);
    } else {
        await interaction.channel.send(`Sprint has been closed for submission.`);
    }

    logger.info(`Sprint ${sprint.id} has completed, returned ${leaderboard.length} rows.`)
}