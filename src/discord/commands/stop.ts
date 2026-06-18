import { SlashCommandBuilder, type CommandInteraction } from "discord.js";
import { activeSession, setActiveSession } from "../recording.ts";
import { sessionEndedSignal } from "../../workflows/session.ts";

export const stop = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop recording and start transcription"),
  handler: async (interaction: CommandInteraction) => {
    if (!activeSession) {
      await interaction.reply("No recording is currently in progress.");
      return;
    }

    const { connection, activations, sessionDir, workflowHandle } =
      activeSession;

    for (const stream of connection.receiver.subscriptions.values()) {
      stream.destroy();
    }

    connection.destroy();
    setActiveSession(null);

    await workflowHandle.signal(sessionEndedSignal);

    await interaction.reply(
      `Recording stopped. ${activations.length} voice activation(s) recorded. Transcript will be saved to \`${sessionDir}/transcript.txt\`.`,
    );
  },
};
