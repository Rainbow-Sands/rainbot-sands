import { CronJob } from 'cron';
import type { Client } from 'discord.js';
import { recappers } from './store';

export const startSchedule = (_bot: Client) => {
	// TODO - Add a cron job to send a reminder to the dnd channel
	// const reminderJob = new CronJob('0 4 * * 6', () => {
	//   // Send a reminder to the dnd channel
	// });
	// reminderJob.start();

	const rotateRecapperSchedule = new CronJob('30 16 0 * * 7', () => {
		if (recappers.length === 0) {
			return;
		}
		recappers.push(recappers.shift()!);
	});
	rotateRecapperSchedule.start();
};
