import type { VoiceConnection, AudioReceiveStream } from "@discordjs/voice";
import type { WriteStream } from "fs";
import type { Transform } from "stream";

export interface UserRecording {
  audioStream: AudioReceiveStream;
  opusDecoder: Transform;
  currentStream: WriteStream;
  chunkPaths: string[];
}

export interface RecordingSession {
  connection: VoiceConnection;
  sessionDir: string;
  userRecordings: Map<string, UserRecording>;
  chunkInterval: ReturnType<typeof setInterval>;
}

export let activeSession: RecordingSession | null = null;

export function setActiveSession(session: RecordingSession | null) {
  activeSession = session;
}
