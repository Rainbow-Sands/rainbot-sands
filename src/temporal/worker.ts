import { NativeConnection, Worker } from "@temporalio/worker";
import { fileURLToPath } from "url";
import * as activities from "./activities/transcribe.ts";

export async function startWorker(): Promise<void> {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_URL,
  });

  const workflowWorker = await Worker.create({
    connection,
    namespace: "rainbot",
    taskQueue: "rainbot",
    workflowsPath: fileURLToPath(new URL("./workflows/session.ts", import.meta.url)),
  });

  const transcriptionWorker = await Worker.create({
    connection,
    namespace: "rainbot",
    taskQueue: "rainbot-transcription",
    activities: {
      transcribeSegment: activities.transcribeSegment,
      aggregateTranscript: activities.aggregateTranscript,
    },
    maxConcurrentActivityTaskExecutions: 4,
  });

  const summarizationWorker = await Worker.create({
    connection,
    namespace: "rainbot",
    taskQueue: "rainbot-summarization",
    activities: {
      summarize: activities.summarize,
      recap: activities.recap,
    },
    maxConcurrentActivityTaskExecutions: 2,
  });

  const shutdown = async () => {
    console.log("[temporal] shutting down workers...");
    await Promise.all([
      workflowWorker.shutdown(),
      transcriptionWorker.shutdown(),
      summarizationWorker.shutdown(),
    ]);
    console.log("[temporal] workers shut down");
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  Promise.all([workflowWorker.run(), transcriptionWorker.run(), summarizationWorker.run()]).catch(
    (err: unknown) => console.error("[temporal] worker error:", err),
  );

  console.log(
    "[temporal] workers started (rainbot / rainbot-transcription / rainbot-summarization)",
  );
}
