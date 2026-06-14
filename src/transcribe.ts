import { writeFileSync } from "fs";
import path from "path";
import type { Activation } from "./discord/recording";

interface TranscriptLine {
  timestamp: string;
  userId: string;
  text: string;
}

// Lines accumulated per session dir so concurrent sessions don't collide.
const sessionLines = new Map<string, TranscriptLine[]>();

const queue: Array<{ activation: Activation; sessionDir: string }> = [];
let processing = false;

interface WhisperResponse {
  text: string;
  segments: { no_speech_prob: number }[];
}

// Clips where Whisper's confidence that speech is present falls below this
// threshold are dropped to prevent hallucinations on noise/brief activations.
const NO_SPEECH_THRESHOLD = 0.6;

async function transcribeFile(audioPath: string, whisperUrl: string): Promise<string | null> {
  const form = new FormData();
  form.append("file", Bun.file(audioPath), path.basename(audioPath));
  form.append("response_format", "verbose_json");

  const res = await fetch(`${whisperUrl}/inference`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error(`whisper server returned ${res.status}`);

  const result = (await res.json()) as WhisperResponse;

  const noSpeechProb =
    result.segments.length > 0 ? Math.max(...result.segments.map((s) => s.no_speech_prob)) : 1;

  if (noSpeechProb > NO_SPEECH_THRESHOLD) {
    console.log(`[transcribe] skipping ${audioPath} (no_speech_prob=${noSpeechProb.toFixed(2)})`);
    return null;
  }

  return result.text.trim() || null;
}

function writeTranscript(sessionDir: string): void {
  const lines = sessionLines.get(sessionDir) ?? [];
  const sorted = [...lines].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const content =
    sorted
      .map(({ timestamp, userId, text }) => {
        const time = new Date(timestamp).toLocaleTimeString("en-CA", {
          hour12: false,
        });
        return `[${time}] ${userId}: ${text}`;
      })
      .join("\n") + "\n";
  writeFileSync(path.join(sessionDir, "transcript.txt"), content, "utf8");
}

async function drainQueue(): Promise<void> {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const { activation, sessionDir } = queue.shift()!;
    const whisperUrl = Bun.env.WHISPER_URL;
    if (!whisperUrl) continue;

    console.log(`[transcribe] processing ${activation.file}`);
    try {
      const text = await transcribeFile(path.join(sessionDir, activation.file), whisperUrl);
      if (text) {
        if (!sessionLines.has(sessionDir)) sessionLines.set(sessionDir, []);
        sessionLines.get(sessionDir)!.push({
          timestamp: activation.timestamp,
          userId: activation.userId,
          text,
        });
        writeTranscript(sessionDir);
      }
    } catch (err) {
      console.error(`[transcribe] failed for ${activation.file}:`, err);
    }
  }

  processing = false;
}

export function enqueueActivation(activation: Activation, sessionDir: string): void {
  if (!Bun.env.WHISPER_URL) return;
  queue.push({ activation, sessionDir });
  drainQueue().catch((err) => console.error("[transcribe] queue error:", err));
}
