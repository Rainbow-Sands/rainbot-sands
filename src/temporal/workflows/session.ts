import {
  condition,
  defineSignal,
  proxyActivities,
  setHandler,
} from "@temporalio/workflow";
import type * as activities from "../activities/transcribe.ts";
import type { Activation } from "../types.ts";

const { transcribeAudio, writeTranscript } = proxyActivities<typeof activities>(
  {
    startToCloseTimeout: "10 minutes",
    retry: { maximumAttempts: 5 },
  },
);

interface TranscriptLine {
  timestamp: string;
  userId: string;
  text: string;
}

export const newActivationSignal = defineSignal<[Activation]>("newActivation");
export const sessionEndedSignal = defineSignal("sessionEnded");

export async function sessionWorkflow(sessionDir: string): Promise<void> {
  const pending: Activation[] = [];
  const done: TranscriptLine[] = [];
  let ended = false;

  setHandler(newActivationSignal, (activation: Activation) => {
    pending.push(activation);
  });

  setHandler(sessionEndedSignal, () => {
    ended = true;
  });

  while (!ended || pending.length > 0) {
    await condition(() => pending.length > 0 || ended, "8h");

    while (pending.length > 0) {
      const activation = pending.shift()!;
      const text = await transcribeAudio(sessionDir, activation.file);
      if (text !== null) {
        done.push({
          timestamp: activation.timestamp,
          userId: activation.userId,
          text,
        });
        await writeTranscript(sessionDir, done);
      }
    }
  }
}
