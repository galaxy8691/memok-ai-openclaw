/**
 * 将 `plugins.entries.memok-ai.config` 中的 LLM 相关项映射到与 CLI 相同的环境变量，
 * 供 `new OpenAI()` / `resolveModel` 等沿用。已设置的非空环境变量**不会被覆盖**。
 */
export type MemokLlmProvider = "inherit" | "openai" | "deepseek" | "openrouter" | "moonshot" | "siliconflow" | "ollama" | "custom";
export type MemokLlmEnvConfig = {
    llmProvider?: MemokLlmProvider;
    /** 写入 `OPENAI_API_KEY`（若进程内尚未设置） */
    llmApiKey?: string;
    /** 仅 `llmProvider=custom` 时使用，写入 `OPENAI_BASE_URL`（若尚未设置） */
    llmBaseUrl?: string;
    /** 写入 `MEMOK_LLM_MODEL`（若尚未设置） */
    llmModel?: string;
    /** 预设模型（通常来自 UI 下拉），当 `llmModel` 为空时回退使用 */
    llmModelPreset?: string;
};
export declare function applyMemokPluginLlmEnv(cfg: MemokLlmEnvConfig | undefined, logger?: {
    warn?: (msg: string) => void;
}): void;
