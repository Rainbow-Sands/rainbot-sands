import { CronJob } from "cron";
import type { Client, TextChannel } from "discord.js";
import { cycleRecapper, getRecapper } from "./db";

export const startSchedule = (bot: Client) => {
  console.log("Beginning recapper announcement schedule");
  const rotateRecapperSchedule = new CronJob("1/5 * * * * *", async () => {
    console.log("cron");
    const channel = await bot.channels.fetch(Bun.env.DISCORD_CHANNEL_ID);
    if (!channel?.isTextBased) {
      return;
    }
    const recappingUser = getRecapper();
    const textChannel = channel as TextChannel;
    if (!recappingUser) {
      textChannel.send("No recappers found.");
      return;
    }
    textChannel.send(
      `Session starts in 1 hour (unless rescheduled). Recapper is <@${recappingUser.id}>`
    );
    cycleRecapper();
  });
  rotateRecapperSchedule.start();
};
