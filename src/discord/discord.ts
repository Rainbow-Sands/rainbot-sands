import {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  type Interaction,
} from "discord.js";
import { start } from "./commands/start.ts";
import { stop } from "./commands/stop.ts";

const commands = { start, stop };

export const registerCommands = async () => {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

  await rest.put(
    Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID!),
    {
      body: Object.values(commands).map(({ data }) => data.toJSON()),
    },
  );
};

export const startBot = async () => {
  const bot = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  });

  bot.once(Events.ClientReady, (c) => {
    console.log(`Discord bot ready. Logged in as ${c.user.tag}`);
  });

  bot.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    if (interaction.commandName in commands) {
      const command =
        commands[interaction.commandName as keyof typeof commands];
      await command.handler(interaction);
    }
  });

  bot.login(process.env.DISCORD_TOKEN!);

  return { bot };
};
