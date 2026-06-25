import type { VoiceConnection } from "@discordjs/voice";
import type { WorkflowHandle } from "@temporalio/client";

export interface RecordingSession {
  connection: VoiceConnection;
  guildId: string;
  channelId: string;
  sessionId: string;
  sessionDir: string;
  segmentCount: number;
  activeUsers: Set<string>;
  workflowHandle: WorkflowHandle;
  end: () => Promise<void>;
}

export let activeSession: RecordingSession | null = null;

export function setActiveSession(session: RecordingSession | null) {
  activeSession = session;
}
