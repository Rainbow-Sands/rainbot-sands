// Post-processing for LLM responses. Shared by the Temporal activities and the
// standalone test script so the cleanup behaviour is identical in both.

// Models often wrap a markdown response in a ```markdown … ``` fence despite
// being asked for raw markdown. Unwrap it, but only when the whole response is a
// single fenced block, so genuine internal code blocks are left untouched.
export function stripCodeFence(text: string): string {
  const match = /^```[^\n]*\n([\s\S]*?)\n?```$/.exec(text.trim());
  return match ? match[1].trim() : text;
}

// Models sometimes wrap a title in quotes despite being told not to.
export function normalizeTitle(text: string): string {
  return text
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();
}
