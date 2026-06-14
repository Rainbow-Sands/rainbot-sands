import { SlashCommandBuilder, type CommandInteraction, type VoiceBasedChannel } from "discord.js";
import { joinVoiceChannel, EndBehaviorType } from "@discordjs/voice";
import prism from "prism-media";
import { mkdirSync, writeFileSync } from "fs";
import { spawn } from "child_process";
import path from "path";
import { activeSession, setActiveSession, type RecordingSession } from "../recording";
import { enqueueActivation } from "../../transcribe";

const SAMPLE_RATE = 48000;
const CHANNELS = 2;

function sessionDirName(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`;
}

function saveMetadata(session: RecordingSession): void {
  writeFileSync(
    path.join(session.sessionDir, "metadata.json"),
    JSON.stringify(session.activations, null, 2),
  );
}

function startActivation(session: RecordingSession, userId: string): void {
  if (session.activeUsers.has(userId)) return;

  const timestamp = new Date().toISOString();
  const filename = `${userId}_${String(session.activationCount).padStart(4, "0")}.ogg`;
  const outputPath = path.join(session.sessionDir, filename);
  session.activationCount++;
  session.activeUsers.add(userId);

  const audioStream = session.connection.receiver.subscribe(userId, {
    end: { behavior: EndBehaviorType.AfterSilence, duration: 2000 },
  });

  const opusDecoder = new prism.opus.Decoder({
    rate: SAMPLE_RATE,
    channels: CHANNELS,
    frameSize: 960,
  });

  const ffmpegProcess = spawn("ffmpeg", [
    "-f",
    "s16le",
    "-ar",
    String(SAMPLE_RATE),
    "-ac",
    String(CHANNELS),
    "-i",
    "pipe:0",
    "-c:a",
    "libopus",
    "-b:a",
    "64k",
    outputPath,
  ]);

  ffmpegProcess.on("error", (err) => console.error(`ffmpeg error (${userId}):`, err));

  audioStream.pipe(opusDecoder as any);
  opusDecoder.pipe(ffmpegProcess.stdin! as any);

  ffmpegProcess.on("close", (code) => {
    session.activeUsers.delete(userId);
    if (code === 0) {
      const activation = { file: filename, timestamp, userId };
      session.activations.push(activation);
      saveMetadata(session);
      enqueueActivation(activation, session.sessionDir);
    }
  });
}

export const start = {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("Join your voice channel and start recording"),
  handler: async (interaction: CommandInteraction) => {
    if (activeSession) {
      await interaction.reply("A recording is already in progress. Use `/stop` to stop it first.");
      return;
    }

    if (!interaction.guildId) {
      await interaction.reply("This command can only be used in a server.");
      return;
    }

    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply("This command can only be used in a server the bot has joined.");
      return;
    }

    const voiceChannelId = guild.voiceStates.cache.get(interaction.user.id)?.channelId;
    if (!voiceChannelId) {
      await interaction.reply("You must be in a voice channel to use this command.");
      return;
    }

    const voiceChannel = guild.channels.cache.get(voiceChannelId) as VoiceBasedChannel | null;
    if (!voiceChannel) {
      await interaction.reply("Could not resolve the voice channel.");
      return;
    }

    if (!Bun.env.MEDIA_PATH) {
      await interaction.reply("MEDIA_PATH environment variable is not configured.");
      return;
    }

    const sessionDir = path.join(Bun.env.MEDIA_PATH, sessionDirName());
    mkdirSync(sessionDir, { recursive: true });

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      adapterCreator: voiceChannel.guild.voiceAdapterCreator as any,
      selfDeaf: false,
    });

    const session: RecordingSession = {
      connection,
      sessionDir,
      activations: [],
      activationCount: 0,
      activeUsers: new Set(),
    };
    setActiveSession(session);

    connection.receiver.speaking.on("start", (userId: string) => {
      startActivation(session, userId);
    });

    await interaction.reply(
      `Joined **${voiceChannel.name}** and started recording. Files will be saved to \`${sessionDir}\`.`,
    );
  },
};
