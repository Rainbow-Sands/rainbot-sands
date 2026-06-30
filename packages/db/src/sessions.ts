import { eq } from "drizzle-orm";
import { db } from "./client.ts";
import { sessions, sessionTranscripts, sessionRecaps } from "./schema.ts";

export interface UpsertSessionInput {
  id: string;
  campaignId: string;
  channelId: string;
  sessionDir: string;
  workflowId: string;
}

export async function upsertSession(input: UpsertSessionInput): Promise<void> {
  await db
    .insert(sessions)
    .values({
      id: input.id,
      campaignId: input.campaignId,
      channelId: input.channelId,
      sessionDir: input.sessionDir,
      workflowId: input.workflowId,
      status: "recording",
    })
    .onConflictDoUpdate({
      target: sessions.id,
      set: {
        campaignId: input.campaignId,
        channelId: input.channelId,
        sessionDir: input.sessionDir,
        workflowId: input.workflowId,
      },
    });
}

export async function setSessionStatus(
  sessionId: string,
  status: string,
  endedAt?: Date
): Promise<void> {
  await db
    .update(sessions)
    .set({ status, ...(endedAt ? { endedAt } : {}) })
    .where(eq(sessions.id, sessionId));
}

export async function setSessionTitle(
  sessionId: string,
  title: string
): Promise<void> {
  await db
    .update(sessions)
    .set({ title })
    .where(eq(sessions.id, sessionId));
}

export async function saveTranscript(
  sessionId: string,
  content: string
): Promise<void> {
  await db
    .insert(sessionTranscripts)
    .values({ sessionId, content })
    .onConflictDoUpdate({
      target: sessionTranscripts.sessionId,
      set: { content },
    });
}

export async function saveRecap(
  sessionId: string,
  summary: string,
  recap: string
): Promise<void> {
  await db
    .insert(sessionRecaps)
    .values({ sessionId, summary, recap })
    .onConflictDoUpdate({
      target: sessionRecaps.sessionId,
      set: { summary, recap },
    });
}
