import { runPredreamDecayFromDb, } from "./predream-pipeline/runPredreamDecayFromDb.js";
import { runStoryWordSentencePipelineFromDb, } from "./story-word-sentence-pipeline/runStoryWordSentencePipelineFromDb.js";
function toStoryPipelineOpts(opts) {
    if (opts === undefined)
        return undefined;
    const { runPredreamDecayFromDbFn: _p, runStoryWordSentencePipelineFromDbFn: _s, ...rest } = opts;
    return rest;
}
/**
 * 顺序执行：先 `runPredreamDecayFromDb`，再 `runStoryWordSentencePipelineFromDb`（同一 `dbPath`）。
 */
export async function runDreamingPipelineFromDb(dbPath, opts) {
    const predreamFn = opts?.runPredreamDecayFromDbFn ?? runPredreamDecayFromDb;
    const storyFn = opts?.runStoryWordSentencePipelineFromDbFn ??
        runStoryWordSentencePipelineFromDb;
    const predream = predreamFn(dbPath);
    const storyWordSentencePipeline = await storyFn(dbPath, toStoryPipelineOpts(opts));
    return { predream, storyWordSentencePipeline };
}
