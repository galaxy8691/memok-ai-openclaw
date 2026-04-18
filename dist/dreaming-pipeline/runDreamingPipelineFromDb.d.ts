import { type PredreamDecayResult, runPredreamDecayFromDb } from "./predream-pipeline/runPredreamDecayFromDb.js";
import { type RunStoryWordSentencePipelineFromDbOpts, runStoryWordSentencePipelineFromDb, type StoryWordSentencePipelineResult } from "./story-word-sentence-pipeline/runStoryWordSentencePipelineFromDb.js";
export type RunDreamingPipelineFromDbOpts = RunStoryWordSentencePipelineFromDbOpts & {
    runPredreamDecayFromDbFn?: typeof runPredreamDecayFromDb;
    /** 编排层单测：替换整段 story pipeline，不会传入内层 `runStoryWordSentencePipelineFromDb`。 */
    runStoryWordSentencePipelineFromDbFn?: typeof runStoryWordSentencePipelineFromDb;
};
/** `predream` + `story-word-sentence-pipeline` 两段报告合并为一份 JSON。 */
export type DreamingPipelineResult = {
    predream: PredreamDecayResult;
    storyWordSentencePipeline: StoryWordSentencePipelineResult;
};
/**
 * 顺序执行：先 `runPredreamDecayFromDb`，再 `runStoryWordSentencePipelineFromDb`（同一 `dbPath`）。
 */
export declare function runDreamingPipelineFromDb(dbPath: string, opts?: RunDreamingPipelineFromDbOpts): Promise<DreamingPipelineResult>;
