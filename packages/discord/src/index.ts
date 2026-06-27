import { registerCommands, startBot } from "./discord.ts";
import { recoverSessions } from "./recovery.ts";

await registerCommands();
const { bot } = await startBot();
await recoverSessions(bot);
