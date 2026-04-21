/**
 * Strip common OpenClaw gateway heartbeat / reminder templates so they are not persisted
 * into Memok or re-injected (avoids accidental HEARTBEAT_OK semantics). Run before zero-width breaking of leftover tokens.
 */
function scrubOpenclawHeartbeatTemplates(text: string): string {
  let s = text;
  // Default English heartbeat instruction block (may start without a leading newline)
  s = s.replace(
    /(^|[\r\n])\s*Read HEARTBEAT\.md if it exists \(workspace context\)\. Follow it strictly\. Do not infer or repeat old tasks from prior chats\. If nothing needs attention, reply HEARTBEAT_OK\.\s*/gim,
    "\n",
  );
  // Scheduled reminder block from trigger through workspace HEARTBEAT.md line
  s = s.replace(
    /(^|[\r\n])\s*A scheduled reminder has been triggered\.[\s\S]*?When reading HEARTBEAT\.md, use workspace file[^\n]*\s*/gim,
    "\n",
  );
  // Standalone workspace / do-not-read / internal reminder lines
  s = s.replace(
    /(^|[\r\n])\s*When reading HEARTBEAT\.md, use workspace file[^\n]*\s*/gim,
    "\n",
  );
  s = s.replace(/(^|[\r\n])\s*Do not read docs\/heartbeat\.md\.?\s*/gim, "\n");
  s = s.replace(
    /(^|[\r\n])\s*Handle this reminder internally[^\n]*\s*/gim,
    "\n",
  );
  s = s.replace(/(^|[\r\n])\s*The reminder content is:\s*/gim, "\n");
  // Chinese HEARTBEAT checklist block (keep regex; legacy gateway copy)
  s = s.replace(
    /执行 HEARTBEAT\.md 检查清单[：:][\s\S]*?完成后报告结果。\s*/g,
    "",
  );
  // Drop orphan empty `System:` noise lines
  s = s.replace(/(^|[\r\n])System:\s*(?=[\r\n]|$)/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

/**
 * OpenClaw treats `HEARTBEAT_OK`, `HEARTBEAT.md`, and heartbeat rounds specially; strip templates first,
 * then break remaining substrings so downstream handlers are not triggered by normal text.
 */
export function scrubOpenclawHeartbeatArtifacts(text: string): string {
  let t = scrubOpenclawHeartbeatTemplates(text);
  t = t.replace(/HEARTBEAT_OK/gi, "HEARTBEAT\u200B_OK");
  t = t.replace(/HEARTBEAT\.md/gi, "HEARTBEAT\u200B.md");
  t = t.replace(/\bHEARTBEAT\b/gi, "HEART\u200DBEAT");
  return t;
}
