import { recappers } from '$lib/store';
import type { CommandInteraction } from 'discord.js';

export const skip = {
	name: 'skip',
	description: 'Skip the current recapper',
	handler: async (interaction: CommandInteraction) => {
		if (recappers.length === 0) {
			await interaction.reply('No recappers');
			return;
		}
		const skippedRecapper = recappers.shift()!;
		recappers.push(skippedRecapper);
		await interaction.reply(
			`${skippedRecapper} has been skipped. Next recapper is ${recappers[0]}`
		);
	}
};
