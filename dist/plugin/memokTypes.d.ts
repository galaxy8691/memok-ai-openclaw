import type { MemokLlmEnvConfig } from "./applyMemokPluginLlmEnv.js";
export declare function getDefaultDbPath(): string;
export declare function expandUserPath(p: string): string;
export declare function resolveMemokDbPathFromConfig(root: Record<string, unknown>): string;
export declare function isMemokSetupCliRun(): boolean;
/** `plugins.entries.memok-ai.config` 与 manifest 字段对应 */
export interface MemokConfig extends MemokLlmEnvConfig {
    dbPath?: string;
    /** 与网关 entry 顶层的 `enabled` 同义时可出现在 config 内 */
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
}
/** 网关 `plugins.entries.memok-ai`：顶层 `enabled`，选项在 `config` */
export interface MemokPluginEntry {
    enabled?: boolean;
    config?: MemokConfig;
}
export declare function cronPatternFromDailyAt(raw: unknown, logger?: {
    warn?: (msg: string) => void;
}): string | undefined;
