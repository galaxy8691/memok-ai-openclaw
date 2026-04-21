/** Legacy inject title (no delimiters); still stripped on persist for old transcripts. */
export const MEMOK_MEMORY_INJECT_MARKER = "【memok-ai 候选记忆】";

/**
 * Pairs with `buildMemoryInjectBlock`: candidate block is wrapped so the full span can be removed before persist,
 * avoiding feeding injected recall text back into SQLite.
 * Uses `@@@` + fixed tokens to reduce accidental collisions with user text.
 */
export const MEMOK_INJECT_START = "@@@MEMOK_RECALL_START@@@";
export const MEMOK_INJECT_END = "@@@MEMOK_RECALL_END@@@";

function stripDelimitedMemokBlocks(text: string): string {
  let out = text;
  for (;;) {
    const start = out.indexOf(MEMOK_INJECT_START);
    if (start === -1) {
      break;
    }
    const afterStart = start + MEMOK_INJECT_START.length;
    const end = out.indexOf(MEMOK_INJECT_END, afterStart);
    if (end === -1) {
      // Start without end: strip through next turn boundary or EOF to avoid half blocks
      const tail = out.slice(afterStart);
      const m = /\n\n((?:User|用户):|OpenClaw:)/.exec(tail);
      const cut = m ? start + MEMOK_INJECT_START.length + m.index : out.length;
      out = `${out.slice(0, start).replace(/\s+$/, "")}${out.slice(cut)}`;
      break;
    }
    const afterEnd = end + MEMOK_INJECT_END.length;
    out = `${out.slice(0, start).replace(/\s+$/, "")}${out.slice(afterEnd)}`;
  }
  return out;
}

/**
 * Remove plugin-injected recall text from a transcript:
 * 1) Full span `@@@MEMOK_RECALL_START@@@` … `@@@MEMOK_RECALL_END@@@`
 * 2) Legacy: from `【memok-ai 候选记忆】` through the line before next `User:`/`用户:`/`OpenClaw:`
 */
export function stripMemokInjectEchoFromTranscript(text: string): string {
  let out = stripDelimitedMemokBlocks(text);
  for (;;) {
    const idx = out.indexOf(MEMOK_MEMORY_INJECT_MARKER);
    if (idx === -1) {
      break;
    }
    const tail = out.slice(idx);
    const m = /\n\n((?:User|用户):|OpenClaw:)/.exec(tail);
    const removeEnd = idx + (m ? m.index : tail.length);
    out = `${out.slice(0, idx).replace(/\s+$/, "")}${out.slice(removeEnd)}`;
  }
  return out.replace(/\n{3,}/g, "\n\n").trim();
}
