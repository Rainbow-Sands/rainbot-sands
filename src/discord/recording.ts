import type { VoiceConnection } from "@discordjs/voice";

export interface Activation {
  file: string;
  timestamp: string;
  userId: string;
}

export interface RecordingSession {
  connection: VoiceConnection;
  sessionDir: string;
  activations: Activation[];
  activationCount: number;
  activeUsers: Set<string>;
}

export let activeSession: RecordingSession | null = null;

export function setActiveSession(session: RecordingSession | null) {
  activeSession = session;
}
