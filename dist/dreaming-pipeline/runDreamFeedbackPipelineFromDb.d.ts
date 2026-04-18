import OpenAI from "openai";
import type { ApplyResultLinkFeedbackResult } from "./applyResultLinkFeedback.js";
import type { MergeOrphanResult } from "./mergeOrphanSentencesIntoTopScored.js";
import { runStoryWordSentenceBucketsFromDb, type StoryWordSentenceBucketsResult } from "./story-word-sentence-pipeline/index.js";
export type RunDreamFeedbackPipelineFromDbOpts = {
    maxWords?: number;
    fraction?: number;
    client?: OpenAI;
    model?: string;
    maxTokens?: number;
    runStoryWordSentenceBucketsFromDbFn?: typeof runStoryWordSentenceBucketsFromDb;
};
export type DreamFeedbackPipelineResult = StoryWordSentenceBucketsResult & {
    feedback: ApplyResultLinkFeedbackResult;
    /** 与 `orphanSentenceMerge` 相同，保留历史字段名 */
    orphanMerge: MergeOrphanResult;
};
/**
 * 与 `runStoryWordSentenceBucketsFromDb` 同一编排；返回对象含其**全部**字段（含 **`orphanSentenceMerge`**），并追加 `feedback`、`orphanMerge` 别名（旧 API）。
 */
export declare function runDreamFeedbackPipelineFromDb(dbPath: string, opts?: RunDreamFeedbackPipelineFromDbOpts): Promise<DreamFeedbackPipelineResult>;
