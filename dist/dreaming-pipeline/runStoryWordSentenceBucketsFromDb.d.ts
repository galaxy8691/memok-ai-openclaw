import OpenAI from "openai";
import { generateDreamText } from "./generateDreamText.js";
import { sampleWordStrings } from "./sampleWordStrings.js";
import { type NormalWordRelevanceBuckets, type RelevanceBuckets } from "./buildRelevanceBuckets.js";
import { applyNormalWordLinkFeedback, type ApplyNormalWordLinkFeedbackResult } from "./applyNormalWordLinkFeedback.js";
import { applyResultLinkFeedback, type ApplyResultLinkFeedbackResult } from "./applyResultLinkFeedback.js";
import { deleteOrphanNormalWords, type DeleteOrphanNormalWordsResult } from "./deleteOrphanNormalWords.js";
import { mergeOrphanSentencesIntoTopScored, type MergeOrphanResult } from "./mergeOrphanSentencesIntoTopScored.js";
import { runNormalWordRelevanceFromDb } from "./runNormalWordRelevanceFromDb.js";
import { runSentenceRelevanceFromDb } from "./runSentenceRelevanceFromDb.js";
import type { NormalWordRelevanceOutput } from "./scoreNormalWordRelevance.js";
import type { SentenceRelevanceOutput } from "./scoreSentenceRelevance.js";
export type RunStoryWordSentenceBucketsFromDbOpts = {
    maxWords?: number;
    fraction?: number;
    client?: OpenAI;
    model?: string;
    maxTokens?: number;
    /** 测试注入 */
    sampleWordStringsFn?: typeof sampleWordStrings;
    generateDreamTextFn?: typeof generateDreamText;
    runSentenceRelevanceFromDbFn?: typeof runSentenceRelevanceFromDb;
    runNormalWordRelevanceFromDbFn?: typeof runNormalWordRelevanceFromDb;
    deleteOrphanNormalWordsFn?: typeof deleteOrphanNormalWords;
    applyNormalWordLinkFeedbackFn?: typeof applyNormalWordLinkFeedback;
    applyResultLinkFeedbackFn?: typeof applyResultLinkFeedback;
    mergeOrphanSentencesIntoTopScoredFn?: typeof mergeOrphanSentencesIntoTopScored;
};
/** `story-word-sentence-buckets` / 库函数 `runStoryWordSentenceBucketsFromDb` 的完整 stdout 形状；字段缺一不可（含末尾 `orphanSentenceMerge`）。 */
export type StoryWordSentenceBucketsResult = {
    story: string;
    words: string[];
    relevance: SentenceRelevanceOutput;
    buckets: RelevanceBuckets;
    /** 句子分桶对 `sentences` / `sentence_to_normal_link` 的回写统计（与 `apply-result-link-feedback` 同源） */
    sentenceLinkFeedback: ApplyResultLinkFeedbackResult;
    normalWordRelevance: NormalWordRelevanceOutput;
    normalWordBuckets: NormalWordRelevanceBuckets;
    normalWordLinkFeedback: ApplyNormalWordLinkFeedbackResult;
    orphanNormalWordsDeleted: DeleteOrphanNormalWordsResult;
    /** 无 `sentence_to_normal_link` 的孤儿句并入本轮最高分句后删除；与 `merge-orphan-sentences` 同源；为完整 dreaming 的最后一步统计 */
    orphanSentenceMerge: MergeOrphanResult;
};
/**
 * 一次完整 dreaming：故事 + 双分支评分与分桶；回写句子/词语 link；删孤立 `normal_words`；再合并删孤立 `sentences`（`orphanSentenceMerge`）。
 */
export declare function runStoryWordSentenceBucketsFromDb(dbPath: string, opts?: RunStoryWordSentenceBucketsFromDbOpts): Promise<StoryWordSentenceBucketsResult>;
