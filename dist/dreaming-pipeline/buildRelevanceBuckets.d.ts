import { z } from "zod";
import { type NormalWordRelevanceOutput } from "./scoreNormalWordRelevance.js";
import { type SentenceRelevanceOutput } from "./scoreSentenceRelevance.js";
export declare const RelevanceBucketsSchema: z.ZodObject<{
    words: z.ZodArray<z.ZodString>;
    id_ge_60: z.ZodArray<z.ZodNumber>;
    id_ge_40_lt_60: z.ZodArray<z.ZodNumber>;
    id_lt_40: z.ZodArray<z.ZodNumber>;
}, z.core.$strict>;
export type RelevanceBuckets = z.infer<typeof RelevanceBucketsSchema>;
/** normal_word 相关性分桶（与句子三档阈值一致） */
export declare const NormalWordRelevanceBucketsSchema: z.ZodObject<{
    id_ge_60: z.ZodArray<z.ZodNumber>;
    id_ge_40_lt_60: z.ZodArray<z.ZodNumber>;
    id_lt_40: z.ZodArray<z.ZodNumber>;
}, z.core.$strict>;
export type NormalWordRelevanceBuckets = z.infer<typeof NormalWordRelevanceBucketsSchema>;
/**
 * 把 normal_word 相关性按阈值分三档（id 为 `normal_words.id`）：
 * - `id_ge_60`: score >= 60
 * - `id_ge_40_lt_60`: 40 <= score < 60
 * - `id_lt_40`: score < 40
 */
export declare function buildNormalWordRelevanceBuckets(relevance: NormalWordRelevanceOutput): NormalWordRelevanceBuckets;
/**
 * 把相关性结果按阈值分三档：
 * - `id_ge_60`: score >= 60
 * - `id_ge_40_lt_60`: 40 <= score < 60
 * - `id_lt_40`: score < 40
 */
export declare function buildRelevanceBuckets(words: string[], relevance: SentenceRelevanceOutput): RelevanceBuckets;
