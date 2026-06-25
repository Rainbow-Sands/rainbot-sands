import {
  Events,
  SlashCommandBuilder,
  type CommandInteraction,
  type VoiceBasedChannel,
  type VoiceState,
} from "discord.js";
import { joinVoiceChannel, EndBehaviorType } from "@discordjs/voice";
import prism from "prism-media";
import { mkdirSync } from "fs";
import { spawn } from "child_process";
import path from "path";
import { activeSession, setActiveSession } from "../recording.ts";
import { getTemporalClient } from "../../temporal/client.ts";
import {
  sessionWorkflow,
  segmentRecorded,
  sessionEnded,
} from "../../temporal/workflows/session.ts";
import type { SegmentRef, SessionInput } from "../../types.ts";

const SAMPLE_RATE = 48000;
const CHANNELS = 2;

function startActivation(
  sessionDir: string,
  segmentId: string,
  userId: string,
  connection: ReturnType<typeof joinVoiceChannel>,
  onDone: (ref: SegmentRef) => void,
  activeUsers: Set<string>
): void {
  if (activeUsers.has(userId)) return;
  activeUsers.add(userId);

  const timestamp = new Date().toISOString();
  const audioFile = `clips/${segmentId}.ogg`;
  const outputPath = path.join(sessionDir, audioFile);

  const audioStream = connection.receiver.subscribe(userId, {
    end: { behavior: EndBehaviorType.AfterSilence, duration: 2000 },
  });

  const opusDecoder = new prism.opus.Decoder({
    rate: SAMPLE_RATE,
    channels: CHANNELS,
    frameSize: 960,
  });

  const ffmpegProcess = spawn("ffmpeg", [
    "-f", "s16le", "-ar", String(SAMPLE_RATE), "-ac", String(CHANNELS),
    "-i", "pipe:0",
    "-c:a", "libopus", "-b:a", "64k",
    outputPath,
  ]);

  ffmpegProcess.on("error", (err) =>
    console.error(`ffmpeg error (${userId}):`, err)
  );

  audioStream.pipe(opusDecoder as any);
  opusDecoder.pipe(ffmpegProcess.stdin! as any);

  ffmpegProcess.on("close", (code) => {
    activeUsers.delete(userId);
    if (code === 0) {
      onDone({ segmentId, audioFile, timestamp, userId });
    }
  });
}

export const start = {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("Join your voice channel and start recording"),
  handler: async (interaction: CommandInteraction) => {
    if (activeSession) {
      await interaction.reply(
        "A recording is already in progress. Use `/stop` to stop it first."
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
        "This command can only be used in a server the bot has joined."
      );
      return;
    }

    const voiceChannelId = guild.voiceStates.cache.get(
      interaction.user.id
    )?.channelId;
    if (!voiceChannelId) {
      await interaction.reply(
        "You must be in a voice channel to use this command."
      );
      return;
    }

    const voiceChannel = guild.channels.cache.get(
      voiceChannelId
    ) as VoiceBasedChannel | null;
    if (!voiceChannel) {
      await interaction.reply("Could not resolve the voice channel.");
      return;
    }

    if (!process.env.MEDIA_PATH) {
      await interaction.reply(
        "MEDIA_PATH environment variable is not configured."
      );
      return;
    }

    const guildId = interaction.guildId;
    const channelId = voiceChannel.id;
    const sessionId = Date.now().toString();
    const sessionDir = path.join(process.env.MEDIA_PATH, guildId, sessionId);
    mkdirSync(path.join(sessionDir, "clips"), { recursive: true });
    mkdirSync(path.join(sessionDir, "transcripts"), { recursive: true });

    const connection = joinVoiceChannel({
      channelId,
      guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator as any,
      selfDeaf: false,
    });

    const sessionInput: SessionInput = { guildId, channelId, sessionId, sessionDir };
    const client = await getTemporalClient();
    const workflowHandle = await client.workflow.start(sessionWorkflow, {
      taskQueue: "rainbot",
      workflowId: `session:${guildId}:${channelId}:${sessionId}`,
      args: [sessionInput],
    });

    let segmentCounter = 0;
    const activeUsers = new Set<string>();

    const onSegmentDone = (ref: SegmentRef) => {
      workflowHandle
        .signal(segmentRecorded, ref)
        .catch((err: unknown) =>
          console.error("[workflow] signal error:", err)
        );
    };

    const endSession = async () => {
      if (!activeSession) return;
      interaction.client.off(Events.VoiceStateUpdate, voiceStateHandler);
      for (const stream of connection.receiver.subscriptions.values()) {
        stream.destroy();
      }
      connection.destroy();
      setActiveSession(null);
      await workflowHandle
        .signal(sessionEnded)
        .catch((err: unknown) =>
          console.error("[workflow] sessionEnded signal error:", err)
        );
      console.log(`[session] ended — ${guildId}:${sessionId}`);
    };

    const voiceStateHandler = (oldState: VoiceState, _newState: VoiceState) => {
      if (oldState.channelId !== channelId) return;
      if (oldState.member?.user.bot) return;
      const channel = oldState.guild.channels.cache.get(channelId);
      if (!channel?.isVoiceBased()) return;
      const humanCount = [...(channel as VoiceBasedChannel).members.values()].filter(
        (m) => !m.user.bot
      ).length;
      if (humanCount === 0) {
        console.log("[session] voice channel empty, auto-ending");
        endSession().catch((err: unknown) =>
          console.error("[session] auto-end error:", err)
        );
      }
    };

    interaction.client.on(Events.VoiceStateUpdate, voiceStateHandler);

    setActiveSession({
      connection,
      guildId,
      channelId,
      sessionId,
      sessionDir,
      segmentCount: 0,
      activeUsers,
      workflowHandle,
      end: endSession,
    });

    connection.receiver.speaking.on("start", (userId: string) => {
      const segId = String(segmentCounter++).padStart(4, "0");
      startActivation(
        sessionDir,
        segId,
        userId,
        connection,
        onSegmentDone,
        activeUsers
      );
      if (activeSession) activeSession.segmentCount = segmentCounter;
    });

    await interaction.reply(
      `Joined **${voiceChannel.name}** and started recording. Session \`${sessionId}\` in \`${sessionDir}\`.`
    );
  },
};
