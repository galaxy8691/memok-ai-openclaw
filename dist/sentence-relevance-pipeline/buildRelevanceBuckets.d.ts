import { z } from "zod";
import { type SentenceRelevanceOutput } from "./scoreSentenceRelevance.js";
export declare const RelevanceBucketsSchema: z.ZodObject<{
    words: z.ZodArray<z.ZodString>;
    id_ge_50: z.ZodArray<z.ZodNumber>;
    id_lt_50: z.ZodArray<z.ZodNumber>;
}, z.core.$strict>;
export type RelevanceBuckets = z.infer<typeof RelevanceBucketsSchema>;
/**
 * 把相关性结果按阈值 50 分分桶：
 * - `id_ge_50`: score >= 50
 * - `id_lt_50`: score < 50
 */
export declare function buildRelevanceBuckets(words: string[], relevance: SentenceRelevanceOutput): RelevanceBuckets;
