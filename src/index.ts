import { registerCommands, startBot } from "./discord/discord.ts";
import { startWorker } from "./temporal/worker.ts";
import { recoverSessions } from "./discord/recovery.ts";

await registerCommands();
const { bot } = await startBot();
await recoverSessions(bot);
await startWorker();
