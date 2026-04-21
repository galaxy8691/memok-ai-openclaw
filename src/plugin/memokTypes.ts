import { homedir } from "node:os";
import { join } from "node:path";
import type { MemokLlmEnvConfig } from "./applyMemokPluginLlmEnv.js";

export function getDefaultDbPath(): string {
  return (
    process.env.MEMOK_MEMORY_DB ||
    join(homedir(), ".openclaw/extensions/memok-ai/memok.sqlite")
  );
}

export function expandUserPath(p: string): string {
  const t = p.trim();
  if (t.startsWith("~/")) {
    return join(homedir(), t.slice(2));
  }
  return t;
}

export function resolveMemokDbPathFromConfig(
  root: Record<string, unknown>,
): string {
  const plugins = (root.plugins as Record<string, unknown> | undefined) ?? {};
  const entries =
    (plugins.entries as Record<string, unknown> | undefined) ?? {};
  const entry =
    (entries["memok-ai"] as Record<string, unknown> | undefined) ?? {};
  const cfg = (entry.config as Record<string, unknown> | undefined) ?? {};
  const raw = typeof cfg.dbPath === "string" ? cfg.dbPath : "";
  return expandUserPath(raw || getDefaultDbPath());
}

export function isMemokSetupCliRun(): boolean {
  const argv = process.argv.map((x) => x.toLowerCase());
  const memokIdx = argv.lastIndexOf("memok");
  if (memokIdx < 0) return false;
  return argv[memokIdx + 1] === "setup";
}

/** Mirrors `plugins.entries.memok-ai.config` and manifest fields */
export interface MemokConfig extends MemokLlmEnvConfig {
  dbPath?: string;
  /** May mirror top-level `enabled` on the gateway entry */
  enabled?: boolean;
  memoryInjectEnabled?: boolean;
  memoryRecallMode?: "skill" | "skill+hint" | "prepend";
  extractFraction?: number;
  longTermFraction?: number;
  maxInjectChars?: number;
  persistTranscriptToMemory?: boolean;
  dreamingPipelineScheduleEnabled?: boolean;
  dreamingPipelineDailyAt?: string;
  dreamingPipelineCron?: string;
  dreamingPipelineTimezone?: string;
  dreamingPipelineMaxWords?: number;
  dreamingPipelineFraction?: number;
  dreamingPipelineMinRuns?: number;
  dreamingPipelineMaxRuns?: number;
  /** Written to config.toml → MemokPipelineConfig; initial sentence weight for new imports */
  articleWordImportInitialWeight?: number;
  /** Written to config.toml; initial sentence duration for new imports */
  articleWordImportInitialDuration?: number;
  /** Written to config.toml; predream short→long-term weight threshold */
  dreamShortTermToLongTermWeightThreshold?: number;
}

/** Gateway entry `plugins.entries.memok-ai`: top-level `enabled`, options under `config` */
export interface MemokPluginEntry {
  enabled?: boolean;
  config?: MemokConfig;
}

export function cronPatternFromDailyAt(
  raw: unknown,
  logger?: { warn?: (msg: string) => void },
): string | undefined {
  if (typeof raw !== "string") {
    return undefined;
  }
  const t = raw.trim();
  if (!t) {
    return undefined;
  }
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) {
    logger?.warn?.(
      `[memok-ai] dreamingPipelineDailyAt invalid format (expected HH:mm): ${t} (中文：格式应为 HH:mm)`,
    );
    return undefined;
  }
  const hour = Number.parseInt(m[1], 10);
  const minute = Number.parseInt(m[2], 10);
  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    logger?.warn?.(
      `[memok-ai] dreamingPipelineDailyAt out of range (00:00–23:59): ${t} (中文：时间超出范围)`,
    );
    return undefined;
  }
  return `${minute} ${hour} * * *`;
}
