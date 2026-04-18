import type { MemokConfig } from "./memokTypes.js";
import type { MemokPluginApi } from "./openclawMemokApi.js";
export type MemokRuntimeContext = {
    pluginCfg: MemokConfig;
    dbPath: string;
    memoryInjectEnabled: boolean;
    memoryRecallMode: NonNullable<MemokConfig["memoryRecallMode"]>;
    extractFraction: number;
    longTermFraction: number;
    maxInjectChars: number;
    persistTranscriptToMemory: boolean;
};
export declare function registerMemokPluginRuntime(api: MemokPluginApi, ctx: MemokRuntimeContext): void;
