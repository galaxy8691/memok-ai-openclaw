import { describe, expect, it } from "vitest";
import {
  buildMemokPipelineConfigForWizard,
  parseMemokPipelineTomlContent,
} from "../src/plugin/memokPipelineConfigToml.js";

describe("parseMemokPipelineTomlContent", () => {
  it("parses a valid minimal table", () => {
    const raw = `
dbPath = "/tmp/memok.sqlite"
openaiApiKey = "sk-test"
llmModel = "gpt-4o-mini"
llmMaxWorkers = 2
articleSentencesMaxOutputTokens = 8192
coreWordsNormalizeMaxOutputTokens = 32768
sentenceMergeMaxCompletionTokens = 2048
`;
    const c = parseMemokPipelineTomlContent(raw, "test");
    expect(c.dbPath).toBe("/tmp/memok.sqlite");
    expect(c.openaiApiKey).toBe("sk-test");
    expect(c.llmModel).toBe("gpt-4o-mini");
    expect(c.llmMaxWorkers).toBe(2);
    expect(c.articleSentencesMaxOutputTokens).toBe(8192);
  });

  it("rejects missing required string", () => {
    expect(() =>
      parseMemokPipelineTomlContent(
        'dbPath = "x"\nopenaiApiKey = ""\nllmModel = "m"',
        "test",
      ),
    ).toThrow(/openaiApiKey/);
  });

  it("parses optional MemokPipelineConfig tuning fields", () => {
    const raw = `
dbPath = "/tmp/memok.sqlite"
openaiApiKey = "sk-test"
llmModel = "gpt-4o-mini"
llmMaxWorkers = 1
articleSentencesMaxOutputTokens = 8192
coreWordsNormalizeMaxOutputTokens = 32768
sentenceMergeMaxCompletionTokens = 2048
articleWordImportInitialWeight = 2
articleWordImportInitialDuration = 14
dreamShortTermToLongTermWeightThreshold = 10
`;
    const c = parseMemokPipelineTomlContent(raw, "test");
    expect(c.articleWordImportInitialWeight).toBe(2);
    expect(c.articleWordImportInitialDuration).toBe(14);
    expect(c.dreamShortTermToLongTermWeightThreshold).toBe(10);
  });

  it("rejects out-of-range optional positive int", () => {
    expect(() =>
      parseMemokPipelineTomlContent(
        `
dbPath = "/tmp/x.sqlite"
openaiApiKey = "k"
llmModel = "m"
llmMaxWorkers = 1
articleSentencesMaxOutputTokens = 8192
coreWordsNormalizeMaxOutputTokens = 32768
sentenceMergeMaxCompletionTokens = 2048
articleWordImportInitialWeight = 0
`,
        "test",
      ),
    ).toThrow(/articleWordImportInitialWeight/);
  });

  it("buildMemokPipelineConfigForWizard copies pipeline tuning from openclaw config", () => {
    const root = {
      plugins: {
        entries: {
          "memok-ai": {
            config: {
              llmApiKey: "sk-wizard-test",
              llmModel: "gpt-4o-mini",
              articleWordImportInitialWeight: 3,
              articleWordImportInitialDuration: 21,
              dreamShortTermToLongTermWeightThreshold: 9,
            },
          },
        },
      },
    } as Record<string, unknown>;
    const c = buildMemokPipelineConfigForWizard(root);
    expect(c.articleWordImportInitialWeight).toBe(3);
    expect(c.articleWordImportInitialDuration).toBe(21);
    expect(c.dreamShortTermToLongTermWeightThreshold).toBe(9);
  });

  it("buildMemokPipelineConfigForWizard ignores invalid tuning numbers", () => {
    const root = {
      plugins: {
        entries: {
          "memok-ai": {
            config: {
              llmApiKey: "sk-wizard-test",
              llmModel: "gpt-4o-mini",
              articleWordImportInitialWeight: 1.5,
              articleWordImportInitialDuration: 0,
            },
          },
        },
      },
    } as Record<string, unknown>;
    const c = buildMemokPipelineConfigForWizard(root);
    expect(c.articleWordImportInitialWeight).toBeUndefined();
    expect(c.articleWordImportInitialDuration).toBeUndefined();
  });
});
