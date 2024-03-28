import type { CommandInteraction } from "discord.js";
import { cycleRecapper, db, getRecapper } from "../../db";

export const discSkip = {
  name: "skip",
  description: "Skip the current recapper",
  handler: async (interaction: CommandInteraction) => {
    db.transaction(async () => {
      const skippedRecapper = getRecapper();
      if (!skippedRecapper) {
        await interaction.reply("No recappers");
        return;
      }
      cycleRecapper();
      const recapper = getRecapper();
      if (!recapper) {
        await interaction.reply("No recappers");
        return;
      }
      await interaction.reply(
        `<@${skippedRecapper.id}> has been skipped. Current recapper is <@${recapper.id}>`
      );
    })();
  },
};
