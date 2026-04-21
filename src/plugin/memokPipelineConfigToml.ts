import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parse, stringify } from "@iarna/toml";
import type { MemokPipelineConfig } from "memok-ai/bridge";
import type { MemokLlmEnvConfig } from "./applyMemokPluginLlmEnv.js";
import { resolveLlmBaseUrlForProvider } from "./applyMemokPluginLlmEnv.js";
import { getMemokExtensionConfigTomlPath } from "./memokConfigPaths.js";
import {
  DEFAULT_LLM_MODEL,
  MEMOK_PIPELINE_DEFAULTS,
} from "./memokPipelineDefaults.js";
import { expandUserPath, resolveMemokDbPathFromConfig } from "./memokTypes.js";

const MAX_LLM_WORKERS_CAP = 64;
/** 与核心 `positiveIntOrDefault` / predream 阈值校验一致：正整数上界（TOML / 向导合并） */
const MAX_ARTICLE_IMPORT_WEIGHT = 1_000_000;
const MAX_ARTICLE_IMPORT_DURATION = 1_000_000;
const MAX_DREAM_SHORT_TERM_WEIGHT_THRESHOLD = 100_000;

function getMemokPluginConfigRecord(
  root: Record<string, unknown>,
): Record<string, unknown> {
  const plugins = (root.plugins as Record<string, unknown> | undefined) ?? {};
  const entries =
    (plugins.entries as Record<string, unknown> | undefined) ?? {};
  const entry =
    (entries["memok-ai"] as Record<string, unknown> | undefined) ?? {};
  return (entry.config as Record<string, unknown> | undefined) ?? {};
}

function getMemokEntryConfig(root: Record<string, unknown>): MemokLlmEnvConfig {
  return getMemokPluginConfigRecord(root) as MemokLlmEnvConfig;
}

/** 从 `openclaw.json` 插件 config 取出与 `MemokPipelineConfig` 对齐的可选数值（仅合法正整数才写入 TOML） */
function optionalPipelineTuningFromOpenclaw(
  cfg: Record<string, unknown>,
): Pick<
  MemokPipelineConfig,
  | "articleWordImportInitialWeight"
  | "articleWordImportInitialDuration"
  | "dreamShortTermToLongTermWeightThreshold"
> {
  const out: Pick<
    MemokPipelineConfig,
    | "articleWordImportInitialWeight"
    | "articleWordImportInitialDuration"
    | "dreamShortTermToLongTermWeightThreshold"
  > = {};
  const w = cfg.articleWordImportInitialWeight;
  if (
    typeof w === "number" &&
    Number.isInteger(w) &&
    w >= 1 &&
    w <= MAX_ARTICLE_IMPORT_WEIGHT
  ) {
    out.articleWordImportInitialWeight = w;
  }
  const d = cfg.articleWordImportInitialDuration;
  if (
    typeof d === "number" &&
    Number.isInteger(d) &&
    d >= 1 &&
    d <= MAX_ARTICLE_IMPORT_DURATION
  ) {
    out.articleWordImportInitialDuration = d;
  }
  const t = cfg.dreamShortTermToLongTermWeightThreshold;
  if (
    typeof t === "number" &&
    Number.isInteger(t) &&
    t >= 1 &&
    t <= MAX_DREAM_SHORT_TERM_WEIGHT_THRESHOLD
  ) {
    out.dreamShortTermToLongTermWeightThreshold = t;
  }
  return out;
}

/**
 * 在 `writeConfigFile(mergeMemokSetupToConfig(...))` 之后调用：从已合并的网关配置生成 `MemokPipelineConfig`。
 * API Key：向导字段 `llmApiKey`，否则一次性读取当前进程的 `OPENAI_API_KEY`（不写回 `.env`）。
 */
export function buildMemokPipelineConfigForWizard(
  root: Record<string, unknown>,
): MemokPipelineConfig {
  const dbPath = resolveMemokDbPathFromConfig(root);
  const entryCfg = getMemokEntryConfig(root);
  const pluginCfg = getMemokPluginConfigRecord(root);
  const pipelineExtras = optionalPipelineTuningFromOpenclaw(pluginCfg);

  const openaiApiKey =
    (entryCfg.llmApiKey ?? "").trim() ||
    (process.env.OPENAI_API_KEY ?? "").trim();
  if (!openaiApiKey) {
    throw new Error(
      "无法生成 config.toml：缺少 openaiApiKey。请在向导中填写 API Key，或在运行 setup 的 shell 中已导出 OPENAI_API_KEY。",
    );
  }

  const llmModel =
    (entryCfg.llmModel ?? "").trim() ||
    (entryCfg.llmModelPreset ?? "").trim() ||
    DEFAULT_LLM_MODEL;

  const openaiBaseUrl = resolveLlmBaseUrlForProvider(entryCfg);

  return {
    dbPath,
    openaiApiKey,
    ...(openaiBaseUrl ? { openaiBaseUrl } : {}),
    llmModel,
    llmMaxWorkers: MEMOK_PIPELINE_DEFAULTS.llmMaxWorkers,
    articleSentencesMaxOutputTokens:
      MEMOK_PIPELINE_DEFAULTS.articleSentencesMaxOutputTokens,
    coreWordsNormalizeMaxOutputTokens:
      MEMOK_PIPELINE_DEFAULTS.coreWordsNormalizeMaxOutputTokens,
    sentenceMergeMaxCompletionTokens:
      MEMOK_PIPELINE_DEFAULTS.sentenceMergeMaxCompletionTokens,
    skipLlmStructuredParse: MEMOK_PIPELINE_DEFAULTS.skipLlmStructuredParse,
    ...pipelineExtras,
  };
}

function expectNonEmptyString(
  v: unknown,
  key: string,
  pathLabel: string,
): string {
  if (typeof v !== "string" || !v.trim()) {
    throw new Error(`${pathLabel}: 缺少或无效字段 "${key}"（需非空字符串）`);
  }
  return v.trim();
}

function expectIntInRange(
  v: unknown,
  key: string,
  pathLabel: string,
  min: number,
  max: number,
): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) {
    throw new Error(`${pathLabel}: 字段 "${key}" 需为数字`);
  }
  const i = Math.trunc(n);
  if (i < min || i > max) {
    throw new Error(
      `${pathLabel}: 字段 "${key}" 需在 ${min}..${max} 范围内（当前 ${i}）`,
    );
  }
  return i;
}

function expectBool(v: unknown, key: string, pathLabel: string): boolean {
  if (typeof v === "boolean") {
    return v;
  }
  if (v === 0 || v === 1) {
    return v === 1;
  }
  throw new Error(`${pathLabel}: 字段 "${key}" 需为布尔值`);
}

/** 解析 TOML 文本为 {@link MemokPipelineConfig}（严格校验）。 */
export function parseMemokPipelineTomlContent(
  raw: string,
  pathLabel: string,
): MemokPipelineConfig {
  let doc: unknown;
  try {
    doc = parse(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`${pathLabel}: TOML 解析失败: ${msg}`);
  }
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    throw new Error(`${pathLabel}: 根节点必须为 table`);
  }
  const o = doc as Record<string, unknown>;

  const dbPath = expectNonEmptyString(o.dbPath, "dbPath", pathLabel);
  const openaiApiKey = expectNonEmptyString(
    o.openaiApiKey,
    "openaiApiKey",
    pathLabel,
  );
  const llmModel = expectNonEmptyString(o.llmModel, "llmModel", pathLabel);

  let openaiBaseUrl: string | undefined;
  if (o.openaiBaseUrl !== undefined && o.openaiBaseUrl !== null) {
    if (typeof o.openaiBaseUrl !== "string") {
      throw new Error(`${pathLabel}: openaiBaseUrl 需为字符串或省略`);
    }
    const t = o.openaiBaseUrl.trim();
    openaiBaseUrl = t ? t : undefined;
  }

  const llmMaxWorkers = expectIntInRange(
    o.llmMaxWorkers ?? MEMOK_PIPELINE_DEFAULTS.llmMaxWorkers,
    "llmMaxWorkers",
    pathLabel,
    1,
    MAX_LLM_WORKERS_CAP,
  );
  const articleSentencesMaxOutputTokens = expectIntInRange(
    o.articleSentencesMaxOutputTokens ??
      MEMOK_PIPELINE_DEFAULTS.articleSentencesMaxOutputTokens,
    "articleSentencesMaxOutputTokens",
    pathLabel,
    512,
    128_000,
  );
  const coreWordsNormalizeMaxOutputTokens = expectIntInRange(
    o.coreWordsNormalizeMaxOutputTokens ??
      MEMOK_PIPELINE_DEFAULTS.coreWordsNormalizeMaxOutputTokens,
    "coreWordsNormalizeMaxOutputTokens",
    pathLabel,
    256,
    128_000,
  );
  const sentenceMergeMaxCompletionTokens = expectIntInRange(
    o.sentenceMergeMaxCompletionTokens ??
      MEMOK_PIPELINE_DEFAULTS.sentenceMergeMaxCompletionTokens,
    "sentenceMergeMaxCompletionTokens",
    pathLabel,
    256,
    128_000,
  );

  let skipLlmStructuredParse: boolean | undefined;
  if (
    o.skipLlmStructuredParse !== undefined &&
    o.skipLlmStructuredParse !== null
  ) {
    skipLlmStructuredParse = expectBool(
      o.skipLlmStructuredParse,
      "skipLlmStructuredParse",
      pathLabel,
    );
  }

  const articleWordImportInitialWeight = expectOptionalPositiveInt(
    o,
    "articleWordImportInitialWeight",
    pathLabel,
    MAX_ARTICLE_IMPORT_WEIGHT,
  );
  const articleWordImportInitialDuration = expectOptionalPositiveInt(
    o,
    "articleWordImportInitialDuration",
    pathLabel,
    MAX_ARTICLE_IMPORT_DURATION,
  );
  const dreamShortTermToLongTermWeightThreshold = expectOptionalPositiveInt(
    o,
    "dreamShortTermToLongTermWeightThreshold",
    pathLabel,
    MAX_DREAM_SHORT_TERM_WEIGHT_THRESHOLD,
  );

  return {
    dbPath,
    openaiApiKey,
    ...(openaiBaseUrl ? { openaiBaseUrl } : {}),
    llmModel,
    llmMaxWorkers,
    articleSentencesMaxOutputTokens,
    coreWordsNormalizeMaxOutputTokens,
    sentenceMergeMaxCompletionTokens,
    ...(skipLlmStructuredParse !== undefined ? { skipLlmStructuredParse } : {}),
    ...(articleWordImportInitialWeight !== undefined
      ? { articleWordImportInitialWeight }
      : {}),
    ...(articleWordImportInitialDuration !== undefined
      ? { articleWordImportInitialDuration }
      : {}),
    ...(dreamShortTermToLongTermWeightThreshold !== undefined
      ? { dreamShortTermToLongTermWeightThreshold }
      : {}),
  };
}

function expectOptionalPositiveInt(
  o: Record<string, unknown>,
  key: string,
  pathLabel: string,
  max: number,
): number | undefined {
  const v = o[key];
  if (v === undefined || v === null) {
    return undefined;
  }
  return expectIntInRange(v, key, pathLabel, 1, max);
}

export function loadMemokPipelineConfig(): MemokPipelineConfig {
  const p = getMemokExtensionConfigTomlPath();
  if (!existsSync(p)) {
    throw new Error(
      `未找到 Memok 管线配置: ${p}。请运行: openclaw memok setup`,
    );
  }
  const raw = readFileSync(p, "utf-8");
  return parseMemokPipelineTomlContent(raw, p);
}

export function writeMemokPipelineToml(cfg: MemokPipelineConfig): void {
  const p = getMemokExtensionConfigTomlPath();
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, stringify(cfg), "utf-8");
}

/** 比较网关解析的 dbPath 与 `config.toml` 是否指向同一文件。 */
export function assertPipelineDbPathMatchesOpenclaw(
  pipeline: MemokPipelineConfig,
  openclawDbPath: string,
): void {
  const a = resolve(expandUserPath(pipeline.dbPath));
  const b = resolve(expandUserPath(openclawDbPath));
  if (a !== b) {
    throw new Error(
      `config.toml 内 dbPath 与网关插件配置不一致: toml=${pipeline.dbPath} 网关=${openclawDbPath}`,
    );
  }
}
