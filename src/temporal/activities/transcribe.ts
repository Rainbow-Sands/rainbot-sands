import { Context, ApplicationFailure } from "@temporalio/activity";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import type { SegmentRef } from "../../types.ts";

interface WhisperResponse {
  text: string;
  segments: { no_speech_prob: number }[];
}

interface TranscriptFragment {
  timestamp: string;
  userId: string;
  text: string;
}

const NO_SPEECH_THRESHOLD = 0.6;

// ── Transcription ─────────────────────────────────────────────────────────────

export async function transcribeSegment(
  sessionDir: string,
  ref: SegmentRef,
): Promise<string | null> {
  const whisperUrl = process.env.WHISPER_URL;
  if (!whisperUrl) throw ApplicationFailure.nonRetryable("WHISPER_URL not set");

  const audioPath = path.join(sessionDir, ref.audioFile);
  if (!existsSync(audioPath)) {
    throw ApplicationFailure.nonRetryable(
      `Audio file not found: ${ref.audioFile}`,
    );
  }

  const abortController = new AbortController();
  Context.current().cancelled.catch(() => abortController.abort());

  const heartbeat = setInterval(() => Context.current().heartbeat(), 5_000);

  try {
    const form = new FormData();
    form.append(
      "file",
      new Blob([new Uint8Array(readFileSync(audioPath))], {
        type: "audio/ogg",
      }),
      path.basename(audioPath),
    );
    form.append("response_format", "verbose_json");

    const res = await fetch(`${whisperUrl}/inference`, {
      method: "POST",
      body: form,
      signal: abortController.signal,
    });

    if (res.status >= 400 && res.status < 500) {
      throw ApplicationFailure.nonRetryable(
        `Whisper rejected the request: ${res.status}`,
      );
    }
    if (!res.ok) throw new Error(`Whisper server returned ${res.status}`);

    const result = (await res.json()) as WhisperResponse;

    const noSpeechProb =
      result.segments.length > 0
        ? Math.max(...result.segments.map((s) => s.no_speech_prob))
        : 1;

    if (noSpeechProb > NO_SPEECH_THRESHOLD) {
      console.log(
        `[transcribe] skipping ${ref.audioFile} (no_speech_prob=${noSpeechProb.toFixed(2)})`,
      );
      return null;
    }

    const text = result.text.trim();
    if (!text) return null;

    const fragment: TranscriptFragment = {
      timestamp: ref.timestamp,
      userId: ref.userId,
      text,
    };

    const outDir = path.join(sessionDir, "transcripts");
    mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `${ref.segmentId}.json`);
    writeFileSync(outPath, JSON.stringify(fragment, null, 2), "utf8");

    return `transcripts/${ref.segmentId}.json`;
  } finally {
    clearInterval(heartbeat);
  }
}

// ── Aggregation ───────────────────────────────────────────────────────────────

export async function aggregateTranscript(
  sessionDir: string,
  keys: string[],
): Promise<string> {
  const fragments: TranscriptFragment[] = keys
    .map((key) => {
      const p = path.join(sessionDir, key);
      if (!existsSync(p)) return null;
      return JSON.parse(readFileSync(p, "utf8")) as TranscriptFragment;
    })
    .filter((f): f is TranscriptFragment => f !== null)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const content =
    fragments
      .map(({ timestamp, userId, text }) => {
        const time = new Date(timestamp).toLocaleTimeString("en-CA", {
          hour12: false,
        });
        return `[${time}] ${userId}: ${text}`;
      })
      .join("\n") + "\n";

  const outPath = path.join(sessionDir, "transcript.txt");
  writeFileSync(outPath, content, "utf8");
  return "transcript.txt";
}

// ── Post-session pipeline ─────────────────────────────────────────────────────

async function llamaComplete(prompt: string, system: string): Promise<string> {
  const llamaUrl = process.env.LLAMA_URL;
  if (!llamaUrl) throw ApplicationFailure.nonRetryable("LLAMA_URL not set");

  const abortController = new AbortController();
  Context.current().cancelled.catch(() => abortController.abort());

  const heartbeat = setInterval(() => Context.current().heartbeat(), 10_000);

  try {
    const res = await fetch(`${llamaUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
      signal: abortController.signal,
    });

    if (res.status >= 400 && res.status < 500) {
      throw ApplicationFailure.nonRetryable(
        `LLaMA rejected the request: ${res.status}`,
      );
    }
    if (!res.ok) throw new Error(`LLaMA server returned ${res.status}`);

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    return data.choices[0]?.message.content.trim() ?? "";
  } finally {
    clearInterval(heartbeat);
  }
}

export async function summarize(
  sessionDir: string,
  transcriptKey: string,
): Promise<string> {
  const transcript = readFileSync(path.join(sessionDir, transcriptKey), "utf8");

  const text = await llamaComplete(
    transcript,
    "You are a note-taker for a tabletop RPG campaign. Given the following session transcript, write a concise summary of what happened: the key events, decisions made, and anything important for next session. Be factual and include character names.",
  );

  const outPath = path.join(sessionDir, "summary.txt");
  writeFileSync(outPath, text, "utf8");
  return "summary.txt";
}

export async function recap(
  sessionDir: string,
  summaryKey: string,
): Promise<string> {
  const summary = readFileSync(path.join(sessionDir, summaryKey), "utf8");

  const text = await llamaComplete(
    summary,
    "You are the narrator of a tabletop RPG campaign. Given the following session summary, write an engaging, dramatic recap of the session as if recapping for the players at the start of the next session. Write in second person ('you and your companions...').",
  );

  const outPath = path.join(sessionDir, "recap.txt");
  writeFileSync(outPath, text, "utf8");
  return "recap.txt";
}
