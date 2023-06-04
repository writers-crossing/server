import config from '../../../data/config.json'

import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { waitMinutes } from '../../app/business'
import { TimerTracker, store } from '../../store'

export const data = new SlashCommandBuilder()
    .setName('start-timer')
    .setDMPermission(false)
    .setDescription('Starts a timer activity.')
    .addNumberOption(x => x.setName('minutes').setDescription('number of minutes the timer will last').setMinValue(1).setMaxValue(60).setRequired(false))

export async function execute(interaction: ChatInputCommandInteraction) {
    if (interaction.channel?.id != config.discordStudyHallId) {
        await interaction.reply({
            content: `You cannot use this command outside of <#${config.discordStudyHallId}>.`,
            ephemeral: true
        })

        return
    }

    if (store.timers.get(interaction.user.id) != null) {
        await interaction.reply({
            content: 'You cannot start a timer when one is already active.',
            ephemeral: true
        })

        return
    }

    const timerLengthMinutes = Math.floor(interaction.options.getNumber('minutes') ?? 20)
    await interaction.reply(`A timer was started by ${interaction.user} for ${timerLengthMinutes} minute(s).`)

    const timerTracker = { ended: false } as TimerTracker
    store.timers.set(interaction.user.id, timerTracker)

    await waitMinutes(timerLengthMinutes)

    timerTracker.ended = true

    await interaction.channel.send(`The timer has ended! Please submit your word count now.`);
    await waitMinutes(config.sprintSubmissionTimeMinutes)

    store.timers.set(interaction.user.id, null)
}