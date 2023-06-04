import config from '../../../data/config.json'

import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { Sprint } from '../../app/entities'
import { getActiveSprint, getEntityUserFromDiscordUser, getSprintWinner } from '../../app/database'
import { getSprintTheme, waitMinutes } from '../../app/business'
import logger from '../../app/logger'

export const data = new SlashCommandBuilder()
    .setName('start-sprint')
    .setDMPermission(false)
    .setDescription('Starts a sprint activity.')
    .addNumberOption(x => x.setName('minutes').setDescription('number of minutes the sprint will last').setMinValue(1).setMaxValue(60).setRequired(false))

export async function execute(interaction: ChatInputCommandInteraction) {
    if (interaction.channel?.id != config.discordStudyHallId) {
        await interaction.reply({
            content: `You cannot use this command outside of <#${config.discordStudyHallId}>.`,
            ephemeral: true
        })

        return
    }

    if (await getActiveSprint() != null) {
        await interaction.reply({
            content: 'You cannot start a sprint when one is already active.',
            ephemeral: true
        })

        return
    }

    const sprintLengthMinutes = Math.floor(interaction.options.getNumber('minutes') ?? 20)

    logger.info(`A sprint was started by ${interaction.user}.`)

    const startResponse = await interaction.reply(`A sprint was started by ${interaction.user}!\nThis sprint will last for ${sprintLengthMinutes} minute(s). You will have ${config.sprintPrepTimeMinutes} minute(s) before this sprint begins.\nReact to this message to join the sprint.`)
    const startMessage = await startResponse.fetch()
    await startMessage.react('👍')
    await waitMinutes(config.sprintPrepTimeMinutes)

    const thumbsUpReactions = startMessage.reactions.cache.filter(reaction => reaction.emoji.name === '👍')
    const participants = (await Promise.all(thumbsUpReactions.map(async reaction => {
        const nonBotUsers = (await reaction.users.fetch()).filter(user => user.bot == false);
        return nonBotUsers.map(x => x);
    }))).flat();
    const participantMentions = participants.map(x => x.toString()).join(" ")

    if (participants.length >= 2 == false) {
        await interaction.channel.send(`There were not at least 2 participants in this sprint. The sprint has been cancelled.`)
        return
    }

    const user = await getEntityUserFromDiscordUser(interaction.user.id, interaction.user.username, interaction.user.avatar)
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

    await interaction.channel.send(`The sprint has started! ${participantMentions}`)
    await waitMinutes(sprintLengthMinutes)

    await interaction.channel.send(`The sprint has ended! Please submit your word count now.\n${participantMentions}`);
    await waitMinutes(config.sprintSubmissionTimeMinutes)

    const winner = await getSprintWinner(sprint.id)

    sprint.ended = true
    sprint.winnerId = winner.id

    await sprint.save()

    await interaction.channel.send(`The winner for this sprint is <@${winner?.discordId}>!\nThe results for this sprint can be found here: <https://writers-crossing.com/sprints/${sprint.id}/>`)
    logger.info(`Sprint ${sprint.id} has completed, had ${participants.length} participants.`)
}