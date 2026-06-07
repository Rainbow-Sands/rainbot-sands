import { SlashCommandBuilder, type CommandInteraction } from "discord.js";
import { spawn } from "child_process";
import { createReadStream, unlinkSync } from "fs";
import path from "path";
import { activeSession, setActiveSession } from "../recording";

function pipeFile(
  filePath: string,
  writable: NodeJS.WritableStream
): Promise<void> {
  return new Promise((resolve, reject) => {
    const rs = createReadStream(filePath);
    rs.pipe(writable, { end: false });
    rs.on("end", resolve);
    rs.on("error", reject);
  });
}

async function encodeChunks(
  chunkPaths: string[],
  outputPath: string
): Promise<void> {
  const ffmpeg = spawn("ffmpeg", [
    "-f", "s16le",
    "-ar", "48000",
    "-ac", "2",
    "-i", "pipe:0",
    "-codec:a", "libmp3lame",
    "-q:a", "2",
    outputPath,
  ]);

  ffmpeg.on("error", (err) => console.error("ffmpeg error:", err));

  const done = new Promise<void>((resolve, reject) => {
    ffmpeg.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`))
    );
  });

  for (const p of chunkPaths) {
    await pipeFile(p, ffmpeg.stdin!);
  }
  ffmpeg.stdin!.end();
  await done;

  for (const p of chunkPaths) unlinkSync(p);
}

export const end = {
  data: new SlashCommandBuilder()
    .setName("end")
    .setDescription("Stop recording and leave the voice channel"),
  handler: async (interaction: CommandInteraction) => {
    if (!activeSession) {
      await interaction.reply("No recording is currently in progress.");
      return;
    }

    const { connection, userRecordings, sessionDir, chunkInterval } =
      activeSession;

    await interaction.deferReply();

    clearInterval(chunkInterval);

    const encodePromises = Array.from(userRecordings.entries()).map(
      ([userId, recording]) => {
        recording.audioStream.destroy();
        recording.opusDecoder.unpipe(recording.currentStream);

        return new Promise<void>((resolve, reject) => {
          recording.currentStream.end(() => {
            const outputPath = path.join(sessionDir, `${userId}.mp3`);
            encodeChunks(recording.chunkPaths, outputPath)
              .then(resolve)
              .catch(reject);
          });
        });
      }
    );

    await Promise.all(encodePromises);

    connection.destroy();
    setActiveSession(null);

    await interaction.editReply(
      `Recording stopped. Saved ${userRecordings.size} audio file(s) to \`${sessionDir}\`.`
    );
  },
};
