import { APPLICATION_ID, DISCORD_TOKEN } from '$env/static/private';
import { startBot } from '$lib/bot';
import { startSchedule } from '$lib/schedule';

if (DISCORD_TOKEN && APPLICATION_ID) {
	const { bot } = startBot();
	startSchedule(bot);
}
