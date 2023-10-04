import { startBot } from '$lib/bot';
import { startSchedule } from '$lib/schedule';

if (import.meta.env.VITE_DISCORD_TOKEN && import.meta.env.VITE_APPLICATION_ID) {
	const { bot } = startBot();
	startSchedule(bot);
}
