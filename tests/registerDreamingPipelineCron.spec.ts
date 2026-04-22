import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  registerDreamingPipelineCron,
  stopDreamingPipelineCron,
} from "../src/plugin/registerDreamingPipelineCron.js";

vi.mock("memok-ai/bridge", async (importOriginal) => {
  const mod = await importOriginal<typeof import("memok-ai/bridge")>();
  return {
    ...mod,
    dreamingPipeline: vi.fn().mockResolvedValue({
      predream: {
        sentencesDurationDecremented: 3,
        promotedToLongTerm: 1,
        deletedSentences: 0,
      },
      storyWordSentencePipeline: { plannedRuns: 3 },
    }),
  };
});

describe("registerDreamingPipelineCron", () => {
  beforeEach(() => {
    stopDreamingPipelineCron();
  });

  it("registers a cron job and logs next run", () => {
    const logs: string[] = [];
    const logger = {
      info: (m: string) => logs.push(m),
      warn: (m: string) => logs.push(m),
      error: (m: string) => logs.push(m),
    };

    registerDreamingPipelineCron({
      logger,
      pipeline: { dbPath: "/tmp/test.sqlite" } as never,
      pattern: "0 3 * * *",
      timezone: "UTC",
    });

    expect(logs.some((l) => l.includes("scheduled"))).toBe(true);
    expect(logs.some((l) => l.includes("dream_logs"))).toBe(true);
    stopDreamingPipelineCron();
  });

  it("logs error for invalid cron pattern", () => {
    const logs: string[] = [];
    const logger = {
      info: (m: string) => logs.push(m),
      warn: (m: string) => logs.push(m),
      error: (m: string) => logs.push(m),
    };

    registerDreamingPipelineCron({
      logger,
      pipeline: { dbPath: "/tmp/test.sqlite" } as never,
      pattern: "not-a-cron",
    });

    expect(logs.some((l) => l.includes("invalid"))).toBe(true);
  });
});
