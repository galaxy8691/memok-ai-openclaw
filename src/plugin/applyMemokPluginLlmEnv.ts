/**
 * Map `plugins.entries.memok-ai.config` LLM fields to the same env vars as the memok-ai CLI,
 * for `new OpenAI()` / `resolveModel`. Non-empty env vars are **never overwritten**.
 */

export type MemokLlmProvider =
  | "inherit"
  | "openai"
  | "deepseek"
  | "openrouter"
  | "moonshot"
  | "siliconflow"
  | "ollama"
  | "custom";

export type MemokLlmEnvConfig = {
  llmProvider?: MemokLlmProvider;
  /** Sets `OPENAI_API_KEY` if not already set in the process */
  llmApiKey?: string;
  /** When `llmProvider=custom`, sets `OPENAI_BASE_URL` if unset */
  llmBaseUrl?: string;
  /** Sets `MEMOK_LLM_MODEL` if unset */
  llmModel?: string;
  /** Preset model (UI dropdown); used when `llmModel` is empty */
  llmModelPreset?: string;
};

const ENV_KEY = "OPENAI_API_KEY";
const ENV_BASE = "OPENAI_BASE_URL";
const ENV_MODEL = "MEMOK_LLM_MODEL";

/** OpenAI-compatible HTTP base (usually ends with `/v1`) */
const PRESET_BASE_URL: Record<
  Exclude<MemokLlmProvider, "inherit" | "openai" | "custom">,
  string
> = {
  deepseek: "https://api.deepseek.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  moonshot: "https://api.moonshot.cn/v1",
  siliconflow: "https://api.siliconflow.cn/v1",
  ollama: "http://127.0.0.1:11434/v1",
};

function envSetIfEmpty(key: string, value: string): void {
  const cur = (process.env[key] ?? "").trim();
  if (cur) {
    return;
  }
  process.env[key] = value;
}

function resolveBaseUrl(
  cfg: MemokLlmEnvConfig,
  provider: MemokLlmProvider,
): string | undefined {
  if (provider === "inherit" || provider === "openai") {
    return undefined;
  }
  if (provider === "custom") {
    const u = (cfg.llmBaseUrl ?? "").trim();
    return u || undefined;
  }
  return PRESET_BASE_URL[provider];
}

/** Resolve OpenAI-compatible base URL from plugin LLM config (for config.toml assembly). */
export function resolveLlmBaseUrlForProvider(
  cfg: MemokLlmEnvConfig,
): string | undefined {
  const provider = (cfg.llmProvider ?? "inherit") as MemokLlmProvider;
  return resolveBaseUrl(cfg, provider);
}

export function applyMemokPluginLlmEnv(
  cfg: MemokLlmEnvConfig | undefined,
  logger?: { warn?: (msg: string) => void },
): void {
  if (!cfg) {
    return;
  }
  const provider = (cfg.llmProvider ?? "inherit") as MemokLlmProvider;

  const key = (cfg.llmApiKey ?? "").trim();
  if (key) {
    envSetIfEmpty(ENV_KEY, key);
  }

  if (provider !== "inherit") {
    const base = resolveBaseUrl(cfg, provider);
    if (provider === "custom" && !base) {
      logger?.warn?.(
        "[memok-ai] llmProvider=custom but llmBaseUrl is empty; OPENAI_BASE_URL not set from plugin config. Set llmBaseUrl or use gateway env. (中文：custom 需填写 Base URL)",
      );
    } else if (base) {
      envSetIfEmpty(ENV_BASE, base);
    }
  }

  const model =
    (cfg.llmModel ?? "").trim() || (cfg.llmModelPreset ?? "").trim();
  if (model) {
    envSetIfEmpty(ENV_MODEL, model);
  }
}
