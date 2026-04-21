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
/** Upper bounds for positive ints; aligned with core `positiveIntOrDefault` / predream checks */
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

/** Read optional numeric tuning from `openclaw.json` plugin config (only valid ints are merged into TOML). */
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
 * Call after `writeConfigFile(mergeMemokSetupToConfig(...))` to build `MemokPipelineConfig` from merged gateway config.
 * API key: wizard `llmApiKey`, else one-shot read of `OPENAI_API_KEY` in the setup shell (not written to `.env`).
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
      "Cannot build config.toml: missing openaiApiKey. Set it in the wizard or export OPENAI_API_KEY before setup. (中文：缺少 API Key)",
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
    throw new Error(
      `${pathLabel}: missing or invalid field "${key}" (expected non-empty string). 中文：字段需为非空字符串`,
    );
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
    throw new Error(
      `${pathLabel}: field "${key}" must be a number. 中文：字段需为数字`,
    );
  }
  const i = Math.trunc(n);
  if (i < min || i > max) {
    throw new Error(
      `${pathLabel}: field "${key}" must be between ${min} and ${max} (got ${i}). 中文：数值超出范围`,
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
  throw new Error(
    `${pathLabel}: field "${key}" must be boolean. 中文：字段需为布尔值`,
  );
}

/** Parse TOML text into {@link MemokPipelineConfig} with strict validation. */
export function parseMemokPipelineTomlContent(
  raw: string,
  pathLabel: string,
): MemokPipelineConfig {
  let doc: unknown;
  try {
    doc = parse(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `${pathLabel}: TOML parse failed: ${msg}. 中文：TOML 解析失败`,
    );
  }
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    throw new Error(
      `${pathLabel}: root must be a TOML table. 中文：根节点必须为表`,
    );
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
      throw new Error(
        `${pathLabel}: openaiBaseUrl must be a string or omitted. 中文：openaiBaseUrl 须为字符串或省略`,
      );
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
      `Memok pipeline config not found: ${p}. Run: openclaw memok setup (中文：请运行 setup)`,
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

/** Ensure resolved `dbPath` from gateway config matches `config.toml`. */
export function assertPipelineDbPathMatchesOpenclaw(
  pipeline: MemokPipelineConfig,
  openclawDbPath: string,
): void {
  const a = resolve(expandUserPath(pipeline.dbPath));
  const b = resolve(expandUserPath(openclawDbPath));
  if (a !== b) {
    throw new Error(
      `config.toml dbPath does not match gateway plugin dbPath: toml=${pipeline.dbPath} gateway=${openclawDbPath} (中文：两处 dbPath 不一致)`,
    );
  }
}
