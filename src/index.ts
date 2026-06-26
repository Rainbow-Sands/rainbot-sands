import { registerCommands, startBot } from "./discord/discord.ts";
import { startWorker } from "./temporal/worker.ts";
import { recoverSessions } from "./discord/recovery.ts";

console.log("Registering commands.");
// await registerCommands();
console.log("Starting the bot.");
const { bot } = await startBot();
console.log("Recovering any active sessions.");
await recoverSessions(bot);
console.log("Starting Temporal worker.");
await startWorker();
