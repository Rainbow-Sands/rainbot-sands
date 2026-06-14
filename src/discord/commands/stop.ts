import { SlashCommandBuilder, type CommandInteraction } from "discord.js";
import { activeSession, setActiveSession } from "../recording";

export const stop = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop recording and leave the voice channel"),
  handler: async (interaction: CommandInteraction) => {
    if (!activeSession) {
      await interaction.reply("No recording is currently in progress.");
      return;
    }

    const { connection, activations, sessionDir } = activeSession;

    for (const stream of connection.receiver.subscriptions.values()) {
      stream.destroy();
    }

    connection.destroy();
    setActiveSession(null);

    await interaction.reply(
      `Recording stopped. ${activations.length} voice activation(s) recorded. Transcript is being written to \`${sessionDir}/transcript.txt\`.`
    );
  },
};
