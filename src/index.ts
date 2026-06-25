import { registerCommands, startBot } from "./discord/discord.ts";
import { startWorker } from "./temporal/worker.ts";

console.log("Registering commands.");
await registerCommands();
console.log("Starting the bot.");
await startBot();
console.log("Starting Temporal worker.");
await startWorker();
