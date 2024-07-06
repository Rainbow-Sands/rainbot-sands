import { CronJob } from "cron";
import type { Client, TextChannel } from "discord.js";
import { cycleRecapper, getRecapper, Quest, getQuests } from "./db";

export const startSchedule = (bot: Client) => {
  const rotateRecapperSchedule = new CronJob(Bun.env.SCHEDULE, async () => {
    const channel = await bot.channels.fetch(Bun.env.DISCORD_CHANNEL_ID);
    if (!channel?.isTextBased) {
      return;
    }
    const recappingUser = getRecapper();
    cycleRecapper();
    const nextRecappingUser = getRecapper();
    const textChannel = channel as TextChannel;
    if (!recappingUser || !nextRecappingUser) {
      textChannel.send("There are no recappers.");
      return;
    }
    textChannel.send(
      `Session starts in 1 hour (unless rescheduled). Recapper is <@${recappingUser.id}>. Next recapper is <@${nextRecappingUser.id}>.`,
    );
  });

  const announceQuests = new CronJob(Bun.env.QUEST_SCHEDULE, async () => {
    const quests = getQuests();
    const channel = await bot.channels.fetch(Bun.env.DISCORD_CHANNEL_ID);
    const textChannel = channel as TextChannel;
    let questText : string = "The next session is coming up! Here are your pending quests:";
    if (quests && quests.length > 0)
      {
        quests.forEach((quest, index) => {
          questText += `\r\n${index}. **${quest.name}**: ${quest.description}`;
        });
        textChannel.send(
          questText,
        );
      }
      
  });

  rotateRecapperSchedule.start();
  announceQuests.start();
};
