import { homedir } from "node:os";
import { join } from "node:path";
export function getDefaultDbPath() {
    return (process.env.MEMOK_MEMORY_DB ||
        join(homedir(), ".openclaw/extensions/memok-ai/memok.sqlite"));
}
export function expandUserPath(p) {
    const t = p.trim();
    if (t.startsWith("~/")) {
        return join(homedir(), t.slice(2));
    }
    return t;
}
export function resolveMemokDbPathFromConfig(root) {
    const plugins = root.plugins ?? {};
    const entries = plugins.entries ?? {};
    const entry = entries["memok-ai"] ?? {};
    const cfg = entry.config ?? {};
    const raw = typeof cfg.dbPath === "string" ? cfg.dbPath : "";
    return expandUserPath(raw || getDefaultDbPath());
}
export function isMemokSetupCliRun() {
    const argv = process.argv.map((x) => x.toLowerCase());
    const memokIdx = argv.lastIndexOf("memok");
    if (memokIdx < 0)
        return false;
    return argv[memokIdx + 1] === "setup";
}
export function cronPatternFromDailyAt(raw, logger) {
    if (typeof raw !== "string") {
        return undefined;
    }
    const t = raw.trim();
    if (!t) {
        return undefined;
    }
    const m = t.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) {
        logger?.warn?.(`[memok-ai] dreamingPipelineDailyAt 格式无效（期望 HH:mm）：${t}`);
        return undefined;
    }
    const hour = Number.parseInt(m[1], 10);
    const minute = Number.parseInt(m[2], 10);
    if (!Number.isFinite(hour) ||
        !Number.isFinite(minute) ||
        hour < 0 ||
        hour > 23 ||
        minute < 0 ||
        minute > 59) {
        logger?.warn?.(`[memok-ai] dreamingPipelineDailyAt 超出范围（00:00~23:59）：${t}`);
        return undefined;
    }
    return `${minute} ${hour} * * *`;
}
