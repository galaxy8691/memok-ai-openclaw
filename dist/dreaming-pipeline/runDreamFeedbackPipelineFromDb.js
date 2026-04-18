import { runStoryWordSentenceBucketsFromDb, } from "./story-word-sentence-pipeline/index.js";
/**
 * 与 `runStoryWordSentenceBucketsFromDb` 同一编排；返回对象含其**全部**字段（含 **`orphanSentenceMerge`**），并追加 `feedback`、`orphanMerge` 别名（旧 API）。
 */
export async function runDreamFeedbackPipelineFromDb(dbPath, opts) {
    const runStoryFn = opts?.runStoryWordSentenceBucketsFromDbFn ?? runStoryWordSentenceBucketsFromDb;
    const storyResult = await runStoryFn(dbPath, opts);
    return {
        ...storyResult,
        feedback: storyResult.sentenceLinkFeedback,
        orphanMerge: storyResult.orphanSentenceMerge,
    };
}
