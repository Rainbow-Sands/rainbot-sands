import { env } from '$env/dynamic/private';
import { startBot } from '$lib/bot';
import { startSchedule } from '$lib/schedule';

if (env.DISCORD_TOKEN && env.APPLICATION_ID) {
	const { bot } = startBot();
	startSchedule(bot);
}
