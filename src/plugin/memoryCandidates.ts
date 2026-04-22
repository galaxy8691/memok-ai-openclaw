import { Type } from "@sinclair/typebox";
import {
  extractMemorySentencesByWordSample,
  type MemokPipelineConfig,
  type MemoryExtractedSentence,
} from "memok-ai/bridge";
import { scrubOpenclawHeartbeatArtifacts } from "./scrubOpenclawHeartbeatArtifacts.js";
import {
  MEMOK_INJECT_END,
  MEMOK_INJECT_START,
  MEMOK_MEMORY_INJECT_MARKER,
} from "./stripMemokInjectEchoFromTranscript.js";

const MEMORY_CANDIDATE_TTL_MS = 30 * 60 * 1000;
const MEMORY_CANDIDATE_MAP_MAX = 50;

/** sessionKey (or fallback) → last injected sentence ids for tool validation and logs */
export const memoryCandidateIdsBySession = new Map<
  string,
  { ids: number[]; at: number }
>();

export const ReportUsedMemoryIdsParams = Type.Object({
  sentenceIds: Type.Array(Type.Integer(), { minItems: 0 }),
});

export const RecallCandidateMemoriesParams = Type.Object({});

function pruneMemoryCandidateMap(): void {
  const now = Date.now();
  for (const [k, v] of memoryCandidateIdsBySession) {
    if (now - v.at > MEMORY_CANDIDATE_TTL_MS) {
      memoryCandidateIdsBySession.delete(k);
    }
  }
  while (memoryCandidateIdsBySession.size > MEMORY_CANDIDATE_MAP_MAX) {
    let oldestKey: string | undefined;
    let oldestAt = Number.POSITIVE_INFINITY;
    for (const [k, v] of memoryCandidateIdsBySession) {
      if (v.at < oldestAt) {
        oldestAt = v.at;
        oldestKey = k;
      }
    }
    if (oldestKey !== undefined) {
      memoryCandidateIdsBySession.delete(oldestKey);
    } else {
      break;
    }
  }
}

function formatOneMemoryLine(s: MemoryExtractedSentence): string {
  const mw = s.matched_word;
  const sentence = scrubOpenclawHeartbeatArtifacts(
    s.sentence.replace(/\s+/g, " ").trim(),
  );
  const w = scrubOpenclawHeartbeatArtifacts(mw.word);
  const nw = scrubOpenclawHeartbeatArtifacts(mw.normal_word);
  return `- [id=${s.id}] ${sentence} (word 词: ${w} → ${nw})`;
}

/**
 * Build prependContext block; append lines until maxChars (best-effort keep first line).
 */
export function buildMemoryInjectBlock(
  sentences: MemoryExtractedSentence[],
  maxChars: number,
): { text: string; ids: number[]; truncated: boolean } {
  const header = `${MEMOK_MEMORY_INJECT_MARKER}Below are randomly sampled lines from the local memory DB; they **may not** relate to the current question.
Decide whether to use them naturally in your reply.
If you use any item, call \`memok_report_used_memory_ids\` this turn with the matching \`id\` list; if you use none, **do not** call that tool.

中文：以下为本地记忆库抽样句子，未必与当前问题相关；采用后请在本轮调用 memok_report_used_memory_ids 上报 id，未采用请勿调用。

`;

  const ids: number[] = [];
  let body = "";
  let truncated = false;
  const wrapOverhead = MEMOK_INJECT_START.length + MEMOK_INJECT_END.length + 2;
  const innerBudget = Math.max(0, maxChars - wrapOverhead);
  const restBudget = Math.max(0, innerBudget - header.length);
  for (const s of sentences) {
    const line = `${formatOneMemoryLine(s)}\n`;
    if (body.length + line.length > restBudget) {
      if (body.length === 0 && line.length > restBudget) {
        body = `${line.slice(0, Math.max(0, restBudget - 1))}…\n`;
        ids.push(s.id);
        truncated = true;
        break;
      }
      truncated = true;
      break;
    }
    body += line;
    ids.push(s.id);
  }
  const inner = scrubOpenclawHeartbeatArtifacts(header + body);
  const text = `${MEMOK_INJECT_START}\n${inner}\n${MEMOK_INJECT_END}`;
  return { text, ids, truncated };
}

export type RecallStoreResult =
  | { kind: "empty" }
  | { kind: "block"; text: string; ids: number[]; truncated: boolean };

/**
 * Sample candidates and store this round's ids for prepend / tools / feedback.
 */
export function recallAndStoreCandidates(
  pipeline: MemokPipelineConfig,
  extractFraction: number,
  longTermFraction: number,
  maxInjectChars: number,
  sessionMemKey: string,
): RecallStoreResult {
  const out = extractMemorySentencesByWordSample({
    ...pipeline,
    fraction: extractFraction,
    longTermFraction,
  });
  if (out.sentences.length === 0) {
    pruneMemoryCandidateMap();
    memoryCandidateIdsBySession.set(sessionMemKey, { ids: [], at: Date.now() });
    return { kind: "empty" };
  }
  const built = buildMemoryInjectBlock(out.sentences, maxInjectChars);
  pruneMemoryCandidateMap();
  memoryCandidateIdsBySession.set(sessionMemKey, {
    ids: built.ids,
    at: Date.now(),
  });
  return {
    kind: "block",
    text: built.text,
    ids: built.ids,
    truncated: built.truncated,
  };
}
