import { SlashCommandBuilder, type CommandInteraction } from "discord.js";
import { replaceQuests, db, Quest } from "../../db";

export const skip = {
  data: new SlashCommandBuilder()
    .setName("ingest")
    .setDescription("Ingest a JSON document containing a list of quests")
    .addStringOption(
        option => option
            .setName('quests')
            .setDescription("A list of quests")
            .setRequired(true)
    ),
  handler: async (interaction: CommandInteraction) => {
    db.transaction(async () => {

      let data = interaction.options.get('json')?.value;
      if (!data || typeof(data) !== "string")
      {
        await interaction.reply("You must provide some quests.");
        return;
      }

      const quests = <Quest[]> JSON.parse(data as string);
      if (quests == null)
      {
        await interaction.reply("Unable to read provided quests.");
        return;
      }
      
      replaceQuests(quests);
      
      await interaction.reply("Refreshed quests with the most current list.");
    })();
  },
};