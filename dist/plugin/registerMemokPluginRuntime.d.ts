import type { MemokConfig } from "./memokTypes.js";
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
export declare function registerMemokPluginRuntime(api: any, ctx: MemokRuntimeContext): void;
