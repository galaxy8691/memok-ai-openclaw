import { beforeEach, describe, expect, it, vi } from "vitest";
import { memoryCandidateIdsBySession } from "../src/plugin/memoryCandidates.js";
import {
  type MemokRuntimeContext,
  registerMemokPluginRuntime,
} from "../src/plugin/registerMemokPluginRuntime.js";

vi.mock("memok-ai/bridge", async (importOriginal) => {
  const mod = await importOriginal<typeof import("memok-ai/bridge")>();
  return {
    ...mod,
    articleWordPipeline: vi.fn(),
    applySentenceUsageFeedback: vi.fn(),
    extractMemorySentencesByWordSample: vi.fn(),
  };
});

vi.mock("../src/plugin/registerDreamingPipelineCron.js", () => ({
  registerDreamingPipelineCron: vi.fn(),
}));

import {
  applySentenceUsageFeedback,
  articleWordPipeline,
  extractMemorySentencesByWordSample,
} from "memok-ai/bridge";

function makeMockApi() {
  const events: Record<string, ((...args: unknown[]) => unknown)[]> = {};
  const tools: { factory: (...args: unknown[]) => unknown; meta: unknown }[] =
    [];
  const logs: { level: string; message: string }[] = [];
  return {
    logger: {
      info: (m: string) => logs.push({ level: "info", message: m }),
      warn: (m: string) => logs.push({ level: "warn", message: m }),
      error: (m: string) => logs.push({ level: "error", message: m }),
      debug: (m: string) => logs.push({ level: "debug", message: m }),
    },
    logs,
    on: (name: string, handler: (...args: unknown[]) => unknown) => {
      events[name] = events[name] ?? [];
      events[name].push(handler);
    },
    registerTool: (factory: (...args: unknown[]) => unknown, meta: unknown) => {
      tools.push({ factory, meta });
    },
    triggerEvent: async (name: string, ...args: unknown[]) => {
      for (const h of events[name] ?? []) {
        const result = h(...args);
        if (result && typeof result.then === "function") {
          await result;
        }
      }
    },
    getTool: (name: string) => {
      for (const t of tools) {
        const tool = t.factory({ sessionKey: "sess-1", sessionId: "sess-1" });
        if (tool.name === name) return tool;
      }
      return undefined;
    },
    tools,
  };
}

function makeCtx(
  overrides?: Partial<MemokRuntimeContext>,
): MemokRuntimeContext {
  return {
    pluginCfg: {
      persistTranscriptToMemory: true,
      memoryInjectEnabled: true,
      memoryRecallMode: "prepend",
      extractFraction: 0.1,
      longTermFraction: 0.05,
      maxInjectChars: 1500,
    } as MemokRuntimeContext["pluginCfg"],
    pipeline: {
      dbPath: "/tmp/test.sqlite",
      openaiApiKey: "sk-test",
      llmModel: "gpt-4o-mini",
      llmMaxWorkers: 1,
      articleSentencesMaxOutputTokens: 8192,
      coreWordsNormalizeMaxOutputTokens: 32768,
      sentenceMergeMaxCompletionTokens: 2048,
    },
    memoryInjectEnabled: true,
    memoryRecallMode: "prepend",
    extractFraction: 0.1,
    longTermFraction: 0.05,
    maxInjectChars: 1500,
    persistTranscriptToMemory: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  memoryCandidateIdsBySession.clear();
});

describe("registerMemokPluginRuntime", () => {
  it("registers dreaming cron when enabled", async () => {
    const { registerDreamingPipelineCron } = await import(
      "../src/plugin/registerDreamingPipelineCron.js"
    );
    const api = makeMockApi();
    registerMemokPluginRuntime(api, {
      ...makeCtx(),
      pluginCfg: {
        ...makeCtx().pluginCfg,
        dreamingPipelineScheduleEnabled: true,
        dreamingPipelineDailyAt: "03:00",
      },
    });
    expect(registerDreamingPipelineCron).toHaveBeenCalled();
  });

  it("skips dreaming cron during CLI setup", () => {
    const api = makeMockApi();
    process.argv = ["node", "openclaw", "memok", "setup"];
    registerMemokPluginRuntime(api, {
      ...makeCtx(),
      pluginCfg: {
        ...makeCtx().pluginCfg,
        dreamingPipelineScheduleEnabled: true,
      },
    });
    expect(api.logs.some((l) => l.message.includes("setup"))).toBe(true);
    process.argv = [];
  });

  it("agent_end persists transcript and tracks session progress", async () => {
    vi.mocked(articleWordPipeline).mockResolvedValue(undefined);
    const api = makeMockApi();
    registerMemokPluginRuntime(api, makeCtx());

    await api.triggerEvent(
      "agent_end",
      {
        success: true,
        messages: [
          { role: "user", content: "hi" },
          { role: "assistant", content: "hello" },
        ],
      },
      { sessionKey: "sess-1" },
    );

    // Wait for async void runSave
    await new Promise((r) => setTimeout(r, 50));
    expect(articleWordPipeline).toHaveBeenCalled();
  });

  it("agent_end skips on failure", async () => {
    vi.mocked(articleWordPipeline).mockResolvedValue(undefined);
    const api = makeMockApi();
    registerMemokPluginRuntime(api, makeCtx());

    await api.triggerEvent(
      "agent_end",
      {
        success: false,
        messages: [{ role: "user", content: "hi" }],
      },
      { sessionKey: "sess-1" },
    );

    await new Promise((r) => setTimeout(r, 50));
    expect(articleWordPipeline).not.toHaveBeenCalled();
  });

  it("message_sent persists outbound content", async () => {
    vi.mocked(articleWordPipeline).mockResolvedValue(undefined);
    const api = makeMockApi();
    registerMemokPluginRuntime(api, makeCtx());

    await api.triggerEvent(
      "message_sent",
      {
        success: true,
        content: "  outbound message  ",
      },
      { conversationId: "conv-1" },
    );

    await new Promise((r) => setTimeout(r, 50));
    expect(articleWordPipeline).toHaveBeenCalled();
  });

  it("before_prompt_build returns prependContext in prepend mode", () => {
    vi.mocked(extractMemorySentencesByWordSample).mockReturnValue({
      sentences: [],
    } as never);
    const handlers: Record<string, ((...args: unknown[]) => unknown)[]> = {};
    const minimalApi = {
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      on: (name: string, handler: (...args: unknown[]) => unknown) => {
        handlers[name] = handlers[name] ?? [];
        handlers[name].push(handler);
      },
      registerTool: () => {},
    };
    registerMemokPluginRuntime(minimalApi, makeCtx());

    expect(handlers.before_prompt_build).toBeDefined();
    expect(handlers.before_prompt_build!.length).toBeGreaterThan(0);

    const result = handlers.before_prompt_build![0](
      {},
      { sessionKey: "sess-1" },
    );
    // With mocked extractMemorySentencesByWordSample returning empty, result should be undefined
    expect(result).toBeUndefined();
  });

  it("memok_report_used_memory_ids validates ids and calls feedback", async () => {
    memoryCandidateIdsBySession.set("sess-1", {
      ids: [1, 2, 3],
      at: Date.now(),
    });
    vi.mocked(applySentenceUsageFeedback).mockReturnValue({
      updatedCount: 2,
    } as never);

    const tools: { factory: (...args: unknown[]) => unknown; meta: unknown }[] =
      [];
    const minimalApi = {
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      on: () => {},
      registerTool: (
        factory: (...args: unknown[]) => unknown,
        meta: unknown,
      ) => {
        tools.push({ factory, meta });
      },
    };

    registerMemokPluginRuntime(minimalApi, makeCtx());

    const reportToolFactory = tools.find(
      (t) =>
        (t.meta as { name: string }).name === "memok_report_used_memory_ids",
    )?.factory;
    expect(reportToolFactory).toBeDefined();

    const tool = reportToolFactory!({ sessionKey: "sess-1" });
    const result = await tool.execute("call-1", { sentenceIds: [1, 2, 99] });
    expect(result.content[0].text).toContain("Updated 2");
    expect(result.details.validIds).toEqual([1, 2]);
  });

  it("memok_recall_candidate_memories returns empty when no candidates", async () => {
    vi.mocked(extractMemorySentencesByWordSample).mockReturnValue({
      sentences: [],
    } as never);

    const tools: { factory: (...args: unknown[]) => unknown; meta: unknown }[] =
      [];
    const minimalApi = {
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      on: () => {},
      registerTool: (
        factory: (...args: unknown[]) => unknown,
        meta: unknown,
      ) => {
        tools.push({ factory, meta });
      },
    };

    registerMemokPluginRuntime(minimalApi, makeCtx());

    const recallToolFactory = tools.find(
      (t) =>
        (t.meta as { name: string }).name === "memok_recall_candidate_memories",
    )?.factory;
    expect(recallToolFactory).toBeDefined();

    const tool = recallToolFactory!({ sessionKey: "sess-1" });
    const result = await tool.execute("call-1", {});
    expect(result.content[0].text).toContain("No candidate");
  });
});
