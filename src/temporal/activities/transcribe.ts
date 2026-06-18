import { readFileSync, writeFileSync } from "fs";
import path from "path";

interface WhisperResponse {
  text: string;
  segments: { no_speech_prob: number }[];
}

interface TranscriptLine {
  timestamp: string;
  userId: string;
  text: string;
}

const NO_SPEECH_THRESHOLD = 0.6;

export async function transcribeAudio(
  sessionDir: string,
  filename: string
): Promise<string | null> {
  const whisperUrl = process.env.WHISPER_URL;
  if (!whisperUrl) throw new Error("WHISPER_URL not set");

  const audioPath = path.join(sessionDir, filename);
  const fileBuffer = readFileSync(audioPath);

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(fileBuffer)]), filename);
  form.append("response_format", "verbose_json");

  const res = await fetch(`${whisperUrl}/inference`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error(`whisper server returned ${res.status}`);

  const result = (await res.json()) as WhisperResponse;

  const noSpeechProb =
    result.segments.length > 0
      ? Math.max(...result.segments.map((s) => s.no_speech_prob))
      : 1;

  if (noSpeechProb > NO_SPEECH_THRESHOLD) {
    console.log(
      `[transcribe] skipping ${filename} (no_speech_prob=${noSpeechProb.toFixed(2)})`
    );
    return null;
  }

  return result.text.trim() || null;
}

export async function writeTranscript(
  sessionDir: string,
  lines: TranscriptLine[]
): Promise<void> {
  const sorted = [...lines].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );
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
