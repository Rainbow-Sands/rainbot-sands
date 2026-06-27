import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type User,
} from "discord.js";
import { createCampaign } from "@rainbot/db";

const PLAYER_SLOTS = 6;

const builder = new SlashCommandBuilder()
  .setName("campaign")
  .setDescription("Create a new campaign (you become the DM)")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("The name of the campaign")
      .setRequired(true)
  );

for (let i = 1; i <= PLAYER_SLOTS; i++) {
  builder.addUserOption((option) =>
    option.setName(`player${i}`).setDescription(`Player ${i}`)
  );
}

export const campaign = {
  data: builder,
  handler: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId || !interaction.guild) {
      await interaction.reply("This command can only be used in a server.");
      return;
    }

    const name = interaction.options.getString("name", true);

    const players: User[] = [];
    for (let i = 1; i <= PLAYER_SLOTS; i++) {
      const player = interaction.options.getUser(`player${i}`);
      if (player) players.push(player);
    }

    try {
      await createCampaign({
        guildId: interaction.guildId,
        guildName: interaction.guild.name,
        name,
        dm: {
          id: interaction.user.id,
          username: interaction.user.username,
        },
        players: players.map((p) => ({ id: p.id, username: p.username })),
      });
    } catch (err) {
      console.error("[campaign] failed to create campaign:", err);
      await interaction.reply("Failed to create the campaign.");
      return;
    }

    const playerMentions =
      players.length > 0
        ? players.map((p) => `<@${p.id}>`).join(", ")
        : "no players yet";
    await interaction.reply(
      `Created campaign **${name}**.\nDM: <@${interaction.user.id}>\nPlayers: ${playerMentions}`
    );
  },
};
