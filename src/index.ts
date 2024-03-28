import { startBot } from "./discord/discord";
import { startSchedule } from "./schedule";

const { bot } = startBot();
startSchedule(bot);
