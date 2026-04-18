/**
 * 将 `plugins.entries.memok-ai.config` 中的 LLM 相关项映射到与 CLI 相同的环境变量，
 * 供 `new OpenAI()` / `resolveModel` 等沿用。已设置的非空环境变量**不会被覆盖**。
 */
const ENV_KEY = "OPENAI_API_KEY";
const ENV_BASE = "OPENAI_BASE_URL";
const ENV_MODEL = "MEMOK_LLM_MODEL";
/** OpenAI 兼容 HTTP 端点（末尾一般含 `/v1`） */
const PRESET_BASE_URL = {
    deepseek: "https://api.deepseek.com/v1",
    openrouter: "https://openrouter.ai/api/v1",
    moonshot: "https://api.moonshot.cn/v1",
    siliconflow: "https://api.siliconflow.cn/v1",
    ollama: "http://127.0.0.1:11434/v1",
};
function envSetIfEmpty(key, value) {
    const cur = (process.env[key] ?? "").trim();
    if (cur) {
        return;
    }
    process.env[key] = value;
}
function resolveBaseUrl(cfg, provider) {
    if (provider === "inherit" || provider === "openai") {
        return undefined;
    }
    if (provider === "custom") {
        const u = (cfg.llmBaseUrl ?? "").trim();
        return u || undefined;
    }
    return PRESET_BASE_URL[provider];
}
export function applyMemokPluginLlmEnv(cfg, logger) {
    if (!cfg) {
        return;
    }
    const provider = (cfg.llmProvider ?? "inherit");
    const key = (cfg.llmApiKey ?? "").trim();
    if (key) {
        envSetIfEmpty(ENV_KEY, key);
    }
    if (provider !== "inherit") {
        const base = resolveBaseUrl(cfg, provider);
        if (provider === "custom" && !base) {
            logger?.warn?.("[memok-ai] llmProvider=custom 但未设置 llmBaseUrl，OPENAI_BASE_URL 未从插件配置写入（请补全或使用网关环境变量）");
        }
        else if (base) {
            envSetIfEmpty(ENV_BASE, base);
        }
    }
    const model = (cfg.llmModel ?? "").trim() || (cfg.llmModelPreset ?? "").trim();
    if (model) {
        envSetIfEmpty(ENV_MODEL, model);
    }
}
