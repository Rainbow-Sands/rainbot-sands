import {
  SlashCommandBuilder,
  type CommandInteraction,
  type VoiceBasedChannel,
} from "discord.js";
import { joinVoiceChannel, EndBehaviorType } from "@discordjs/voice";
import prism from "prism-media";
import { createWriteStream, mkdirSync } from "fs";
import path from "path";
import {
  activeSession,
  setActiveSession,
  type RecordingSession,
} from "../recording";

const CHUNK_INTERVAL_MS = 60000;

function sessionDirName(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`;
}

function chunkPath(sessionDir: string, userId: string, index: number): string {
  return path.join(
    sessionDir,
    `${userId}_${String(index).padStart(4, "0")}.pcm`,
  );
}

function startUserRecording(session: RecordingSession, userId: string): void {
  if (session.userRecordings.has(userId)) return;

  const audioStream = session.connection.receiver.subscribe(userId, {
    end: { behavior: EndBehaviorType.Manual },
  });

  const opusDecoder = new prism.opus.Decoder({
    rate: 48000,
    channels: 2,
    frameSize: 960,
  });

  const firstPath = chunkPath(session.sessionDir, userId, 0);
  const fileStream = createWriteStream(firstPath);

  audioStream.pipe(opusDecoder);
  opusDecoder.pipe(fileStream);

  session.userRecordings.set(userId, {
    audioStream,
    opusDecoder,
    currentStream: fileStream,
    chunkPaths: [firstPath],
  });
}

function rotateChunks(session: RecordingSession): void {
  for (const [userId, recording] of session.userRecordings) {
    const { opusDecoder, currentStream, chunkPaths } = recording;

    opusDecoder.unpipe(currentStream);
    currentStream.end();

    const nextPath = chunkPath(session.sessionDir, userId, chunkPaths.length);
    const nextStream = createWriteStream(nextPath);
    opusDecoder.pipe(nextStream);

    recording.currentStream = nextStream;
    chunkPaths.push(nextPath);
  }
}

export const start = {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("Join your voice channel and start recording"),
  handler: async (interaction: CommandInteraction) => {
    if (activeSession) {
      await interaction.reply(
        "A recording is already in progress. Use `/end` to stop it first.",
      );
      return;
    }

    if (!interaction.guildId) {
      await interaction.reply("This command can only be used in a server.");
      return;
    }

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply(
        "This command can only be used in a server the bot has joined.",
      );
      return;
    }

    const voiceChannelId = guild.voiceStates.cache.get(
      interaction.user.id,
    )?.channelId;
    if (!voiceChannelId) {
      await interaction.reply(
        "You must be in a voice channel to use this command.",
      );
      return;
    }

    const voiceChannel = guild.channels.cache.get(
      voiceChannelId,
    ) as VoiceBasedChannel | null;
    if (!voiceChannel) {
      await interaction.reply("Could not resolve the voice channel.");
      return;
    }

    if (!Bun.env.MEDIA_PATH) {
      await interaction.reply(
        "MEDIA_PATH environment variable is not configured.",
      );
      return;
    }

    const sessionDir = path.join(Bun.env.MEDIA_PATH, sessionDirName());
    mkdirSync(sessionDir, { recursive: true });

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false,
    });

    const session: RecordingSession = {
      connection,
      sessionDir,
      userRecordings: new Map(),
      chunkInterval: setInterval(
        () => rotateChunks(session),
        CHUNK_INTERVAL_MS,
      ),
    };
    setActiveSession(session);

    connection.receiver.speaking.on("start", (userId: string) => {
      startUserRecording(session, userId);
    });

    await interaction.reply(
      `Joined **${voiceChannel.name}** and started recording. Files will be saved to \`${sessionDir}\`.`,
    );
  },
};
