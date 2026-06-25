import { SlashCommandBuilder, type CommandInteraction } from "discord.js";
import { activeSession } from "../recording.ts";

export const stop = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop recording and start transcription"),
  handler: async (interaction: CommandInteraction) => {
    if (!activeSession) {
      await interaction.reply("No recording is currently in progress.");
      return;
    }

    const { segmentCount, sessionDir } = activeSession;
    await activeSession.end();

    await interaction.reply(
      `Recording stopped. ${segmentCount} segment(s) recorded. Transcript and recap will be saved to \`${sessionDir}\`.`,
    );
  },
};
