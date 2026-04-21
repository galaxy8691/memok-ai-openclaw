/**
 * 与 memok-ai `MemokPipelineConfig` 写入 TOML 的常用默认值一致（不读 `.env`）。
 */
export const DEFAULT_LLM_MODEL = "gpt-4o-mini";
export const DEFAULT_ARTICLE_SENTENCES_MAX_OUTPUT = 8192;
export const DEFAULT_CORE_WORDS_NORMALIZE_MAX_OUTPUT = 32768;
export const DEFAULT_SENTENCE_MERGE_MAX_COMPLETION = 2048;

/** 写入 `config.toml` 时使用的管线数值默认（与核心 `memokPipelineConfigFromProcessEnv` 无 env 时等价）。 */
export const MEMOK_PIPELINE_DEFAULTS = {
  llmMaxWorkers: 1,
  articleSentencesMaxOutputTokens: DEFAULT_ARTICLE_SENTENCES_MAX_OUTPUT,
  coreWordsNormalizeMaxOutputTokens: DEFAULT_CORE_WORDS_NORMALIZE_MAX_OUTPUT,
  sentenceMergeMaxCompletionTokens: DEFAULT_SENTENCE_MERGE_MAX_COMPLETION,
  skipLlmStructuredParse: false,
} as const;
