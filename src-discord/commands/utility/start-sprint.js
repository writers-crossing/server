import { SlashCommandBuilder } from 'discord.js';
import { getActiveSprint, getUser, Sprint } from '../../app/database.js'
import randomWords from 'random-words'

function toPascalCase(str) {
    // Replace underscores and hyphens with spaces
    str = str.replace(/[_-]/g, ' ');

    // Capitalize each word
    str = str.replace(/\b\w/g, function (match) {
        return match.toUpperCase();
    });

    // Remove spaces
    str = str.replace(/\s+/g, '');

    return str;
}

export const data = new SlashCommandBuilder()
    .setName('start-sprint')
    .setDMPermission(false)
    .setDescription('Starts a sprint activity.')
    .addNumberOption(x => x.setName('minutes').setDescription('number of minutes the sprint will last').setMinValue(1).setMaxValue(60).setRequired(false))

export async function execute(interaction) {
    if (await getActiveSprint() != null) {
        await interaction.reply(`A sprint is already going on.`)
        return
    }

    const user = await getUser(interaction.user.id, interaction.user.username, interaction.member.displayName ?? interaction.user.username)
    const sprintMinutes = interaction.options.getNumber('minutes') ?? 20

    const sprintName = randomWords({ exactly: 2, formatter: (word) => toPascalCase(word), join: ' ' })
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + sprintMinutes * 60000);

    const sprint = await Sprint.create({
        name: sprintName,
        createdBy: user.id,
        length: sprintMinutes,
        startTime: startTime,
        endTime: endTime,
        ended: false
    })

    await interaction.reply(`A Sprint was started by ${interaction.user}! This sprint is called ${sprintName}.\nThis sprint will last ${sprintMinutes} minutes.`)

    async function pencilsDown() {
        await interaction.channel.send(`${sprint.name} has ended!\nIn order to contribute to this sprint, you must submit word count with the project of \`sprint\`.\nPlease submit your word count now.`);
        
        // Wait 2 minutes.
        await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));

        sprint.ended = true
        await sprint.save()

        await interaction.channel.send(`${sprint.name} has been closed for submission.`);
    }

    setTimeout(pencilsDown, sprintMinutes * 60 * 1000)
}