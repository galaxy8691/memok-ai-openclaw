import type { Command } from "commander";
/**
 * 网关传给 `register(api)` 的最小能力面（OpenClaw 未作为依赖安装时的本地契约）。
 * 刻意宽松：仅收窄本插件实际用到的成员，避免 `api: any` 蔓延。
 */
export type MemokPluginLogger = {
    info?: (msg: string) => void;
    warn?: (msg: string) => void;
    error?: (msg: string) => void;
    debug?: (msg: string) => void;
};
export type MemokRuntimeConfigApi = {
    loadConfig?: () => unknown;
    writeConfigFile?: (cfg: unknown) => Promise<void> | void;
};
export type MemokOpenclawPluginsConfig = {
    entries?: Record<string, unknown>;
};
export type MemokPluginApi = {
    logger?: MemokPluginLogger;
    runtime?: {
        config?: MemokRuntimeConfigApi;
    };
    config?: {
        plugins?: MemokOpenclawPluginsConfig;
    };
    /** manifest 默认配置（网关注入） */
    pluginConfig?: unknown;
    registerCli: (fn: (args: {
        program: Command;
    }) => void, meta?: unknown) => void;
    registerCommand: (cmd: {
        name: string;
        description?: string;
        acceptsArgs?: boolean;
        handler: (ctx: Record<string, unknown>) => Promise<unknown> | unknown;
    }) => void;
    /** 部分钩子（如 before_prompt_build）允许返回提示词补丁对象 */
    on: (event: string, handler: (...args: unknown[]) => unknown) => void;
    registerTool: (factory: (toolCtx: Record<string, unknown>) => unknown, meta?: unknown) => void;
};
