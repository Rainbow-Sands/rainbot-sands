import { recappers } from '$lib/store';
import type { CommandInteraction } from 'discord.js';

export const current = {
	name: 'current',
	description: 'Get the current recapper',
	handler: async (interaction: CommandInteraction) => {
		if (recappers.length === 0) {
			await interaction.reply('No recappers');
			return;
		}
		await interaction.reply(`Current recapper is ${recappers[0]}`);
	}
};
