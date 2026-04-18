import type { ApplyNormalWordLinkFeedbackResult } from "./applyNormalWordLinkFeedback.js";
import type { ApplyResultLinkFeedbackResult } from "./applyResultLinkFeedback.js";
import { runStoryWordSentenceBucketsFromDb, type RunStoryWordSentenceBucketsFromDbOpts } from "./runStoryWordSentenceBucketsFromDb.js";
export type RunStoryWordSentencePipelineFromDbOpts = RunStoryWordSentenceBucketsFromDbOpts & {
    /** 随机轮数下限（含），默认 3 */
    minRuns?: number;
    /** 随机轮数上限（含），默认 5 */
    maxRuns?: number;
    /** 单测或确定性编排：覆盖随机轮数 */
    pickRunCount?: (min: number, max: number) => number;
    runStoryWordSentenceBucketsFromDbFn?: typeof runStoryWordSentenceBucketsFromDb;
};
/** 多轮 `orphanSentenceMerge` 的计数求和（无单轮 `topSentenceId`） */
export type StoryWordSentencePipelineOrphanMergeTotals = {
    orphansFound: number;
    mergedCount: number;
    deletedCount: number;
};
/** 仅含多轮汇总统计，不含每轮 story/relevance/buckets 等大字段 */
export type StoryWordSentencePipelineResult = {
    minRuns: number;
    maxRuns: number;
    plannedRuns: number;
    sentenceLinkFeedback: ApplyResultLinkFeedbackResult;
    normalWordLinkFeedback: ApplyNormalWordLinkFeedbackResult;
    orphanNormalWordsDeleted: {
        count: number;
        ids: number[];
    };
    orphanSentenceMerge: StoryWordSentencePipelineOrphanMergeTotals;
};
/**
 * 在 [minRuns, maxRuns] 内随机决定轮数，对同一 DB 顺序执行多轮完整 `runStoryWordSentenceBucketsFromDb`。
 * 任一轮抛错则整体中止并向上抛出。
 */
export declare function runStoryWordSentencePipelineFromDb(dbPath: string, opts?: RunStoryWordSentencePipelineFromDbOpts): Promise<StoryWordSentencePipelineResult>;
