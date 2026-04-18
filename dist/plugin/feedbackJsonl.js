import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
export function appendFeedbackJsonl(logPath, row) {
    const dir = dirname(logPath);
    mkdirSync(dir, { recursive: true });
    appendFileSync(logPath, `${JSON.stringify(row)}\n`, "utf-8");
}
