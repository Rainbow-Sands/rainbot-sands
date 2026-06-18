import { registerCommands, startBot } from "./discord/discord.ts";

console.log("Registering commands.");
await registerCommands();
console.log("Starting the bot.");
const { bot } = await startBot();
