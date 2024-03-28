import { registerCommands, startBot } from "./discord/discord";
import { startSchedule } from "./schedule";

console.log("Registering commands.");
await registerCommands();
console.log("Starting the bot.");
const { bot } = await startBot();
console.log("Starting the recapper schedule.");
startSchedule(bot);
