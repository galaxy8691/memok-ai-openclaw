import { z } from "zod";
import { SentenceRelevanceOutputSchema, } from "./scoreSentenceRelevance.js";
export const RelevanceBucketsSchema = z
    .object({
    words: z.array(z.string()),
    id_ge_50: z.array(z.number().int()),
    id_lt_50: z.array(z.number().int()),
})
    .strict();
/**
 * 把相关性结果按阈值 50 分分桶：
 * - `id_ge_50`: score >= 50
 * - `id_lt_50`: score < 50
 */
export function buildRelevanceBuckets(words, relevance) {
    const parsed = SentenceRelevanceOutputSchema.parse(relevance);
    const id_ge_50 = [];
    const id_lt_50 = [];
    for (const row of parsed.sentences) {
        if (row.score >= 50) {
            id_ge_50.push(row.id);
        }
        else {
            id_lt_50.push(row.id);
        }
    }
    return RelevanceBucketsSchema.parse({
        words: [...words],
        id_ge_50,
        id_lt_50,
    });
}
