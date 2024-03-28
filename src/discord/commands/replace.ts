import { SlashCommandBuilder, type CommandInteraction } from "discord.js";
import { replaceRecappers } from "../../db";

export const replace = {
  data: new SlashCommandBuilder()
    .setName("replace")
    .setDescription("Replace the list of recappers")
    // Discord doesn't support lists, so here we are.
    .addUserOption((option) =>
      option.setName("user1").setDescription("The first recapper")
    )
    .addUserOption((option) =>
      option.setName("user2").setDescription("The second recapper")
    )
    .addUserOption((option) =>
      option.setName("user3").setDescription("The third recapper")
    )
    .addUserOption((option) =>
      option.setName("user4").setDescription("The fourth recapper")
    )
    .addUserOption((option) =>
      option.setName("user5").setDescription("The fifth recapper")
    ),
  handler: async (interaction: CommandInteraction) => {
    const recappers = [
      interaction.options.getUser("user1")?.id,
      interaction.options.getUser("user2")?.id,
      interaction.options.getUser("user3")?.id,
      interaction.options.getUser("user4")?.id,
      interaction.options.getUser("user5")?.id,
    ].filter(Boolean) as string[];
    replaceRecappers(recappers);
    await interaction.reply("Recappers replaced.");
  },
};
