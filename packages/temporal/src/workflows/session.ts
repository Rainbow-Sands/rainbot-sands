import {
  condition,
  continueAsNew,
  defineQuery,
  defineSignal,
  proxyActivities,
  setHandler,
  upsertSearchAttributes,
} from "@temporalio/workflow";
import type * as activities from "../activities/transcribe.ts";
import type { SegmentRef, SessionInput, SessionStatus } from "../types.ts";

const { transcribeSegment, aggregateTranscript } = proxyActivities<typeof activities>({
  taskQueue: "rainbot-transcription",
  startToCloseTimeout: "15 minutes",
  scheduleToCloseTimeout: "1 hour",
  retry: {
    maximumAttempts: 5,
    initialInterval: "5 seconds",
    backoffCoefficient: 2,
  },
});

const { summarize, recap } = proxyActivities<typeof activities>({
  taskQueue: "rainbot-summarization",
  startToCloseTimeout: "30 minutes",
  scheduleToCloseTimeout: "2 hours",
  retry: {
    maximumAttempts: 3,
    initialInterval: "10 seconds",
    backoffCoefficient: 2,
  },
});

const CONTINUE_AS_NEW_THRESHOLD = 500;

export const segmentRecorded = defineSignal<[SegmentRef]>("segmentRecorded");
export const sessionEnded = defineSignal("sessionEnded");
export const getStatus = defineQuery<SessionStatus>("getStatus");

interface SessionContinuation {
  carriedOverKeys: string[];
}

export async function sessionWorkflow(
  input: SessionInput,
  continuation?: SessionContinuation,
): Promise<void> {
  const carriedOverKeys: string[] = continuation?.carriedOverKeys ?? [];
  const pending: Promise<string | null>[] = [];
  let ended = false;
  let segmentCount = 0;
  let transcribedCount = 0;
  let lastError: string | undefined;
  let phase: SessionStatus["phase"] = "recording";

  upsertSearchAttributes({
    GuildId: [input.guildId],
    ChannelId: [input.channelId],
        SegmentCount: [0],
  });

  setHandler(segmentRecorded, (ref: SegmentRef) => {
    segmentCount++;
    pending.push(
      transcribeSegment(input.sessionDir, ref)
        .then((key) => {
          transcribedCount++;
          return key;
        })
        .catch((err: unknown) => {
          lastError = err instanceof Error ? err.message : String(err);
          return null;
        }),
    );
    upsertSearchAttributes({ SegmentCount: [segmentCount] });
  });

  setHandler(sessionEnded, () => {
    ended = true;
  });

  setHandler(getStatus, () => ({ phase, segmentCount, transcribedCount, lastError }));

  // Wait for session end, resetting the 1-hour idle timer on each new segment.
  let lastSegmentCount = 0;
  while (!ended) {
    lastSegmentCount = segmentCount;
    const hadActivity = await condition(() => segmentCount > lastSegmentCount || ended, "1 hour");
    if (!hadActivity) {
      ended = true; // idle timeout
    }

    if (segmentCount >= CONTINUE_AS_NEW_THRESHOLD && !ended) {
      const completedKeys = (await Promise.allSettled(pending))
        .filter((r): r is PromiseFulfilledResult<string | null> => r.status === "fulfilled")
        .map((r) => r.value)
        .filter((k): k is string => k !== null);
      await continueAsNew<typeof sessionWorkflow>(input, {
        carriedOverKeys: [...carriedOverKeys, ...completedKeys],
      });
    }
  }

  // Drain all in-flight transcriptions.
  phase = "transcribing";

  const newKeys = (await Promise.allSettled(pending))
    .filter((r): r is PromiseFulfilledResult<string | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((k): k is string => k !== null);

  const allKeys = [...carriedOverKeys, ...newKeys];

  if (allKeys.length === 0) {
      return;
  }

  // Post-session pipeline.
  const transcriptKey = await aggregateTranscript(input.sessionDir, allKeys);

  phase = "summarizing";

  const summaryKey = await summarize(input.sessionDir, transcriptKey);
  await recap(input.sessionDir, summaryKey);

  phase = "done";
}
