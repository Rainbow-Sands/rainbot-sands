import { Client, Events, GatewayIntentBits, REST, Routes, type Interaction } from 'discord.js';
import { skip } from './server/commands/skip';
import { current } from './server/commands/current';
import { env } from '$env/dynamic/private';

const commands = [current, skip];

export const startBot = () => {
	const bot = new Client({ intents: [GatewayIntentBits.Guilds] });
	const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

	// Register commands
	rest.put(Routes.applicationCommands(env.APPLICATION_ID), {
		body: commands.map(({ name, description }) => ({ name, description }))
	});

	bot.once(Events.ClientReady, (c) => {
		console.log(`Discord bot ready. Logged in as ${c.user.tag}`);
	});

	bot.on('interactionCreate', async (interaction: Interaction) => {
		if (!interaction.isChatInputCommand()) {
			return;
		}
		const command = commands.find(({ name }) => interaction.commandName === name);
		if (command) {
			await command.handler(interaction);
		}
	});

	bot.login(env.DISCORD_TOKEN);

	return { bot };
};
