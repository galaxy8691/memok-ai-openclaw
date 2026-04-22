import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildMemoryInjectBlock,
  memoryCandidateIdsBySession,
  recallAndStoreCandidates,
} from "../src/plugin/memoryCandidates.js";
import {
  MEMOK_INJECT_END,
  MEMOK_INJECT_START,
} from "../src/plugin/stripMemokInjectEchoFromTranscript.js";

vi.mock("memok-ai/bridge", async (importOriginal) => {
  const mod = await importOriginal<typeof import("memok-ai/bridge")>();
  return {
    ...mod,
    extractMemorySentencesByWordSample: vi.fn(),
  };
});

import { extractMemorySentencesByWordSample } from "memok-ai/bridge";

beforeEach(() => {
  memoryCandidateIdsBySession.clear();
  vi.resetAllMocks();
});

describe("buildMemoryInjectBlock", () => {
  it("returns empty block when no sentences", () => {
    const result = buildMemoryInjectBlock([], 500);
    expect(result.text).toContain(MEMOK_INJECT_START);
    expect(result.text).toContain(MEMOK_INJECT_END);
    expect(result.ids).toEqual([]);
    expect(result.truncated).toBe(false);
  });

  it("includes sentences within budget", () => {
    const sentences = [
      {
        id: 1,
        sentence: "First memory line",
        matched_word: { word: "a", normal_word: "A" },
      },
      {
        id: 2,
        sentence: "Second memory line",
        matched_word: { word: "b", normal_word: "B" },
      },
    ];
    const result = buildMemoryInjectBlock(sentences as never, 2000);
    expect(result.ids).toEqual([1, 2]);
    expect(result.truncated).toBe(false);
    expect(result.text).toContain("[id=1]");
    expect(result.text).toContain("[id=2]");
  });

  it("truncates when exceeding maxChars", () => {
    const longSentence = "x".repeat(500);
    const sentences = [
      {
        id: 1,
        sentence: longSentence,
        matched_word: { word: "a", normal_word: "A" },
      },
    ];
    const result = buildMemoryInjectBlock(sentences as never, 300);
    expect(result.ids).toEqual([1]);
    expect(result.truncated).toBe(true);
  });
});

describe("recallAndStoreCandidates", () => {
  it("returns empty when no sentences found", () => {
    vi.mocked(extractMemorySentencesByWordSample).mockReturnValue({
      sentences: [],
    } as never);
    const result = recallAndStoreCandidates(
      { dbPath: "/tmp/test.sqlite" } as never,
      0.1,
      0.05,
      1000,
      "sess-1",
    );
    expect(result.kind).toBe("empty");
    const stored = memoryCandidateIdsBySession.get("sess-1");
    expect(stored?.ids).toEqual([]);
  });

  it("returns block and stores ids when sentences found", () => {
    vi.mocked(extractMemorySentencesByWordSample).mockReturnValue({
      sentences: [
        {
          id: 7,
          sentence: "hello",
          matched_word: { word: "hi", normal_word: "hello" },
        },
      ],
    } as never);
    const result = recallAndStoreCandidates(
      { dbPath: "/tmp/test.sqlite" } as never,
      0.1,
      0.05,
      2000,
      "sess-2",
    );
    expect(result.kind).toBe("block");
    if (result.kind === "block") {
      expect(result.ids).toEqual([7]);
    }
    const stored = memoryCandidateIdsBySession.get("sess-2");
    expect(stored?.ids).toEqual([7]);
  });

  it("prunes old entries when map exceeds max size", () => {
    vi.mocked(extractMemorySentencesByWordSample).mockReturnValue({
      sentences: [],
    } as never);
    for (let i = 0; i < 55; i++) {
      memoryCandidateIdsBySession.set(`sess-${i}`, {
        ids: [],
        at: Date.now() - i * 1000,
      });
    }
    recallAndStoreCandidates(
      { dbPath: "/tmp/test.sqlite" } as never,
      0.1,
      0.05,
      1000,
      "new-sess",
    );
    // prune happens before adding new entry: 55 -> 50 oldest removed, then +1 new = 51
    expect(memoryCandidateIdsBySession.size).toBe(51);
  });
});
