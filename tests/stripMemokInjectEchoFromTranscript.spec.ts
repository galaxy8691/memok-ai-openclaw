import { describe, expect, it } from "vitest";
import {
  MEMOK_INJECT_END,
  MEMOK_INJECT_START,
  stripMemokInjectEchoFromTranscript,
} from "../src/plugin/stripMemokInjectEchoFromTranscript.js";

describe("stripMemokInjectEchoFromTranscript", () => {
  it("removes delimited recall blocks", () => {
    const text = `User: hello\n\n${MEMOK_INJECT_START}\nRecall content\n${MEMOK_INJECT_END}\n\nOpenClaw: reply`;
    const out = stripMemokInjectEchoFromTranscript(text);
    expect(out).not.toContain(MEMOK_INJECT_START);
    expect(out).not.toContain(MEMOK_INJECT_END);
    expect(out).toContain("User: hello");
    expect(out).toContain("OpenClaw: reply");
  });

  it("removes legacy marker blocks up to next turn", () => {
    const text =
      "User: hi\n\n【memok-ai 候选记忆】\n- id=1 line\n\nUser: next turn";
    const out = stripMemokInjectEchoFromTranscript(text);
    expect(out).not.toContain("【memok-ai 候选记忆】");
    expect(out).toContain("User: hi");
    expect(out).toContain("User: next turn");
  });

  it("handles unclosed start delimiter by stripping to next turn", () => {
    const text = `User: hello\n\n${MEMOK_INJECT_START}\nunclosed content\n\nUser: next`;
    const out = stripMemokInjectEchoFromTranscript(text);
    expect(out).not.toContain(MEMOK_INJECT_START);
    expect(out).toContain("User: hello");
    expect(out).toContain("User: next");
  });

  it("collapses excessive newlines", () => {
    const text = "A\n\n\n\nB";
    const out = stripMemokInjectEchoFromTranscript(text);
    expect(out).not.toContain("\n\n\n");
  });

  it("returns trimmed text", () => {
    expect(stripMemokInjectEchoFromTranscript("  plain text  ")).toBe(
      "plain text",
    );
  });
});
