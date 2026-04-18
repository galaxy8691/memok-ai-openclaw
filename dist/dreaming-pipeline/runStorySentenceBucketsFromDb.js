import { generateDreamText } from "./generateDreamText.js";
import { sampleWordStrings } from "./sampleWordStrings.js";
import { buildRelevanceBuckets } from "./buildRelevanceBuckets.js";
import { runSentenceRelevanceFromDb } from "./runSentenceRelevanceFromDb.js";
/**
 * 一键链路：
 * 1) 从 words 抽样 10 词（可配）
 * 2) LLM 生成故事
 * 3) 从 sentences 抽样约 20% 做相关性评分
 * 4) 按三档阈值做 id 分桶（见 buildRelevanceBuckets）
 */
export async function runStorySentenceBucketsFromDb(dbPath, opts) {
    const words = sampleWordStrings(dbPath, { maxWords: opts?.maxWords });
    const story = await generateDreamText(words, {
        client: opts?.client,
        model: opts?.model,
        maxTokens: opts?.maxTokens,
    });
    const relevance = await runSentenceRelevanceFromDb(dbPath, story, {
        fraction: opts?.fraction ?? 0.2,
        client: opts?.client,
        model: opts?.model,
        maxTokens: opts?.maxTokens,
    });
    const buckets = buildRelevanceBuckets(words, relevance);
    return { story, words, relevance, buckets };
}
