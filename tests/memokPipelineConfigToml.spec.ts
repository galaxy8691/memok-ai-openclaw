import { describe, expect, it } from "vitest";
import { parseMemokPipelineTomlContent } from "../src/plugin/memokPipelineConfigToml.js";

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
});
