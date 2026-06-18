import type { VoiceConnection } from "@discordjs/voice";
import type { WorkflowHandle } from "@temporalio/client";
import type { Activation } from "../types.ts";

export type { Activation };

export interface RecordingSession {
  connection: VoiceConnection;
  sessionDir: string;
  activations: Activation[];
  activationCount: number;
  activeUsers: Set<string>;
  workflowHandle: WorkflowHandle;
}

export let activeSession: RecordingSession | null = null;

export function setActiveSession(session: RecordingSession | null) {
  activeSession = session;
}
