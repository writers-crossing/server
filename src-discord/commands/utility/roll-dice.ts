import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { DiceRoll } from '@dice-roller/rpg-dice-roller'

export const data = new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Rolls dice.')
    .addStringOption(x => x.setName('notation').setDescription('dice roll notation').setRequired(true))

export async function execute(interaction: ChatInputCommandInteraction) {
    const notation = interaction.options.getString('notation')
    if (notation === null) {
		await interaction.reply({
			content: 'You must specify a proper notation.',
			ephemeral: true
		})

        return
    }

    const result = new DiceRoll(notation)
    await interaction.reply(`${interaction.user} rolled the dice... ${result.output}!`)
}