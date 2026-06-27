import { existsSync, readFileSync } from "fs";
import path from "path";
import {
  upsertSession,
  setSessionStatus,
  saveTranscript,
  saveRecap,
  type UpsertSessionInput,
} from "@rainbot/db";

export async function recordSessionStart(
  input: UpsertSessionInput
): Promise<void> {
  await upsertSession(input);
}

// endedAt is decided here (not in the workflow) so workflow code stays
// deterministic. Terminal states get an end timestamp.
export async function updateSessionStatus(
  sessionId: string,
  status: string
): Promise<void> {
  const terminal = status === "done" || status === "failed";
  await setSessionStatus(sessionId, status, terminal ? new Date() : undefined);
}

export async function persistTranscript(
  sessionDir: string,
  sessionId: string,
  transcriptKey: string
): Promise<void> {
  const p = path.join(sessionDir, transcriptKey);
  if (!existsSync(p)) return;
  await saveTranscript(sessionId, readFileSync(p, "utf8"));
}

export async function persistRecap(
  sessionDir: string,
  sessionId: string,
  summaryKey: string,
  recapKey: string
): Promise<void> {
  const summaryPath = path.join(sessionDir, summaryKey);
  const recapPath = path.join(sessionDir, recapKey);
  const summary = existsSync(summaryPath)
    ? readFileSync(summaryPath, "utf8")
    : "";
  const recap = existsSync(recapPath) ? readFileSync(recapPath, "utf8") : "";
  await saveRecap(sessionId, summary, recap);
}
