/**
 * Defaults aligned with memok-ai `MemokPipelineConfig` values commonly written to TOML (no `.env` read here).
 */
export const DEFAULT_LLM_MODEL = "gpt-4o-mini";
export const DEFAULT_ARTICLE_SENTENCES_MAX_OUTPUT = 8192;
export const DEFAULT_CORE_WORDS_NORMALIZE_MAX_OUTPUT = 32768;
export const DEFAULT_SENTENCE_MERGE_MAX_COMPLETION = 2048;

/** Numeric defaults when writing `config.toml` (same idea as core env defaults when unset). */
export const MEMOK_PIPELINE_DEFAULTS = {
  llmMaxWorkers: 1,
  articleSentencesMaxOutputTokens: DEFAULT_ARTICLE_SENTENCES_MAX_OUTPUT,
  coreWordsNormalizeMaxOutputTokens: DEFAULT_CORE_WORDS_NORMALIZE_MAX_OUTPUT,
  sentenceMergeMaxCompletionTokens: DEFAULT_SENTENCE_MERGE_MAX_COMPLETION,
  skipLlmStructuredParse: false,
} as const;
