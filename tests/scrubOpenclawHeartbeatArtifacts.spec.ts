import { describe, expect, it } from "vitest";
import { scrubOpenclawHeartbeatArtifacts } from "../src/plugin/scrubOpenclawHeartbeatArtifacts.js";

describe("scrubOpenclawHeartbeatArtifacts", () => {
  it("strips English heartbeat template", () => {
    const text =
      "Hello\nRead HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.\nWorld";
    const out = scrubOpenclawHeartbeatArtifacts(text);
    expect(out).not.toContain("Read HEARTBEAT.md");
    expect(out).toContain("Hello");
    expect(out).toContain("World");
  });

  it("strips scheduled reminder block", () => {
    const text =
      "Start\nA scheduled reminder has been triggered.\nWhen reading HEARTBEAT.md, use workspace file.\nEnd";
    const out = scrubOpenclawHeartbeatArtifacts(text);
    expect(out).not.toContain("scheduled reminder");
    expect(out).toContain("Start");
    expect(out).toContain("End");
  });

  it("strips Chinese heartbeat checklist", () => {
    const text =
      "前缀\n执行 HEARTBEAT.md 检查清单：\n1. 检查 A\n2. 检查 B\n完成后报告结果。\n后缀";
    const out = scrubOpenclawHeartbeatArtifacts(text);
    expect(out).not.toContain("HEARTBEAT.md 检查清单");
    expect(out).toContain("前缀");
    expect(out).toContain("后缀");
  });

  it("breaks remaining HEARTBEAT tokens with zero-width spaces", () => {
    const text = "HEARTBEAT_OK and HEARTBEAT.md";
    const out = scrubOpenclawHeartbeatArtifacts(text);
    // After scrubbing, the raw tokens should be gone
    expect(out).not.toContain("HEARTBEAT_OK");
    expect(out).not.toContain("HEARTBEAT.md");
    // The third regex \bHEARTBEAT\b also matches the HEARTBEAT prefix inside
    // HEARTBEAT\u200B_OK and HEARTBEAT\u200B.md because \u200B is a non-word char,
    // so they become HEART\u200DBEAT\u200B_OK and HEART\u200DBEAT\u200B.md
    expect(out).toContain("HEART\u200DBEAT\u200B_OK");
    expect(out).toContain("HEART\u200DBEAT\u200B.md");
  });

  it("drops orphan System: lines", () => {
    const text = "A\nSystem:\nB";
    const out = scrubOpenclawHeartbeatArtifacts(text);
    expect(out).not.toContain("System:");
    expect(out).toContain("A");
    expect(out).toContain("B");
  });
});
