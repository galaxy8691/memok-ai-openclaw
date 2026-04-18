import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { applyNormalWordLinkFeedback, } from "./applyNormalWordLinkFeedback.js";
import { applyResultLinkFeedback, } from "./applyResultLinkFeedback.js";
import { buildNormalWordRelevanceBuckets, buildRelevanceBuckets, } from "./buildRelevanceBuckets.js";
import { deleteOrphanNormalWords, } from "./deleteOrphanNormalWords.js";
import { generateDreamText } from "./generateDreamText.js";
import { mergeOrphanSentencesIntoTopScored, } from "./mergeOrphanSentencesIntoTopScored.js";
import { runNormalWordRelevanceFromDb } from "./runNormalWordRelevanceFromDb.js";
import { runSentenceRelevanceFromDb } from "./runSentenceRelevanceFromDb.js";
import { sampleWordStrings } from "./sampleWordStrings.js";
/**
 * 一次完整 dreaming：故事 + 双分支评分与分桶；回写句子/词语 link；删孤立 `normal_words`；再合并删孤立 `sentences`（`orphanSentenceMerge`）。
 */
export async function runStoryWordSentenceBucketsFromDb(dbPath, opts) {
    const sampleWordsFn = opts?.sampleWordStringsFn ?? sampleWordStrings;
    const genStoryFn = opts?.generateDreamTextFn ?? generateDreamText;
    const runSentFn = opts?.runSentenceRelevanceFromDbFn ?? runSentenceRelevanceFromDb;
    const runNwFn = opts?.runNormalWordRelevanceFromDbFn ?? runNormalWordRelevanceFromDb;
    const delOrphanFn = opts?.deleteOrphanNormalWordsFn ?? deleteOrphanNormalWords;
    const applyNwFbFn = opts?.applyNormalWordLinkFeedbackFn ?? applyNormalWordLinkFeedback;
    const applySentFbFn = opts?.applyResultLinkFeedbackFn ?? applyResultLinkFeedback;
    const mergeOrphanFn = opts?.mergeOrphanSentencesIntoTopScoredFn ??
        mergeOrphanSentencesIntoTopScored;
    const words = sampleWordsFn(dbPath, { maxWords: opts?.maxWords });
    const story = await genStoryFn(words, {
        client: opts?.client,
        model: opts?.model,
        maxTokens: opts?.maxTokens,
    });
    const fraction = opts?.fraction ?? 0.2;
    const llmOpts = {
        client: opts?.client,
        model: opts?.model,
        maxTokens: opts?.maxTokens,
    };
    const [relevance, normalWordRelevance] = await Promise.all([
        runSentFn(dbPath, story, { fraction, ...llmOpts }),
        runNwFn(dbPath, story, { fraction, ...llmOpts }),
    ]);
    const buckets = buildRelevanceBuckets(words, relevance);
    const sentenceLinkFeedback = applySentFbFn(dbPath, {
        words,
        buckets,
    });
    const normalWordBuckets = buildNormalWordRelevanceBuckets(normalWordRelevance);
    const normalWordLinkFeedback = applyNwFbFn(dbPath, {
        words,
        normalWordBuckets,
    });
    const orphanNormalWordsDeleted = delOrphanFn(dbPath);
    const payload = {
        story,
        words,
        relevance,
        buckets,
        sentenceLinkFeedback,
        normalWordRelevance,
        normalWordBuckets,
        normalWordLinkFeedback,
        orphanNormalWordsDeleted,
    };
    const tempDir = mkdtempSync(join(tmpdir(), "memok-story-buckets-"));
    const tempResultPath = join(tempDir, "result.json");
    let orphanSentenceMerge;
    try {
        writeFileSync(tempResultPath, JSON.stringify(payload), "utf-8");
        orphanSentenceMerge = await mergeOrphanFn(dbPath, tempResultPath);
    }
    finally {
        rmSync(tempDir, { recursive: true, force: true });
    }
    return { ...payload, orphanSentenceMerge };
}
