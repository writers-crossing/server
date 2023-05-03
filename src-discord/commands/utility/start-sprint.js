import config from '../../../data/config.json' assert { type: "json" }

import { SlashCommandBuilder } from 'discord.js';
import { getActiveSprint, getUser, Sprint, calculateWinnerForSprint } from '../../app/database.js'
import { getSprintTheme, waitMinutes } from '../../app/business.js'

export const data = new SlashCommandBuilder()
    .setName('start-sprint')
    .setDMPermission(false)
    .setDescription('Starts a sprint activity.')
    .addNumberOption(x => x.setName('minutes').setDescription('number of minutes the sprint will last').setMinValue(1).setMaxValue(60).setRequired(false))

export async function execute(interaction) {
    if (await getActiveSprint() != null) {
        await interaction.reply(`You cannot start a sprint. A sprint is already going on.`)
        return
    }

    const user = await getUser(interaction.user.id, interaction.user.username, interaction.member.displayName ?? interaction.user.username)
    const sprintLengthMinutes = interaction.options.getNumber('minutes') ?? 20
    const startTime = new Date(new Date() + config.sprintPrepTimeMinutes * 60 * 1000)
    const endTime = new Date(startTime.getTime() + sprintLengthMinutes * 60 * 1000)

    const sprint = await Sprint.create({
        name: getSprintTheme(),
        createdBy: user.id,
        length: sprintLengthMinutes,
        startTime: startTime,
        endTime: endTime,
        ended: false
    })

    await interaction.reply(`A Sprint was started by ${interaction.user}! The sprint is called ${sprint.name}.\nThis sprint will last for ${sprintLengthMinutes} minutes.\nYou will have ${config.sprintPrepTimeMinutes} minutes before this sprint begins. Get ready!`)
    await waitMinutes(config.sprintPrepTimeMinutes)

    await interaction.channel.send(`The sprint has started!`)
    await waitMinutes(sprintLengthMinutes)

    await interaction.channel.send(`The sprint ${sprint.name} has ended!\nIn order to contribute to this sprint, you must submit word count with the project of \`sprint\`.\nPlease submit your word count now.`);
    await waitMinutes(config.sprintSubmissionTimeMinutes)

    const winner = calculateWinnerForSprint(sprint.id)

    sprint.ended = true
    sprint.winnerId = winner.id

    await sprint.save()

    if (winner) {
        await interaction.channel.send(`Sprint has been closed for submission.\nThe winner for this sprint is ${winner.nickname}!\nThe results for this sprint can be found here: <https://writers-crossing.com/sprints/${sprint.id}/>`);
    } else {
        await interaction.channel.send(`Sprint has been closed for submission.`);
    }
}