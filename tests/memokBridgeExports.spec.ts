import type {
  DreamingPipelineConfig,
  MemokPipelineConfig,
} from "memok-ai/bridge";
import {
  applySentenceUsageFeedback,
  articleWordPipeline,
  dreamingPipeline,
  extractMemorySentencesByWordSample,
} from "memok-ai/bridge";
import { describe, expect, it } from "vitest";

/**
 * Smoke-test the installed `memok-ai` tarball against the symbols and
 * `MemokPipelineConfig` shape this plugin relies on (see plan: bridge parity).
 */
describe("memok-ai/bridge (plugin integration surface)", () => {
  it("exports all pipeline and recall entrypoints", () => {
    expect(typeof articleWordPipeline).toBe("function");
    expect(typeof dreamingPipeline).toBe("function");
    expect(typeof extractMemorySentencesByWordSample).toBe("function");
    expect(typeof applySentenceUsageFeedback).toBe("function");
  });

  it("accepts MemokPipelineConfig matching plugin TOML fields", () => {
    const cfg: MemokPipelineConfig = {
      dbPath: "/tmp/memok-bridge-smoke.sqlite",
      openaiApiKey: "sk-test",
      llmModel: "gpt-4o-mini",
      llmMaxWorkers: 1,
      articleSentencesMaxOutputTokens: 8192,
      coreWordsNormalizeMaxOutputTokens: 32768,
      sentenceMergeMaxCompletionTokens: 2048,
    };
    const dream: DreamingPipelineConfig = {
      ...cfg,
      dreamLogWarn: () => {},
    };
    expect(dream.dbPath).toBe(cfg.dbPath);
  });
});
