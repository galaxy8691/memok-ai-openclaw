import OpenAI from "openai";
import { type RelevanceBuckets } from "./buildRelevanceBuckets.js";
export type RunStorySentenceBucketsFromDbOpts = {
    maxWords?: number;
    fraction?: number;
    client?: OpenAI;
    model?: string;
    maxTokens?: number;
};
export type StorySentenceBucketsResult = {
    story: string;
    words: string[];
    relevance: {
        sentences: {
            id: number;
            score: number;
        }[];
    };
    buckets: RelevanceBuckets;
};
/**
 * 一键链路：
 * 1) 从 words 抽样 10 词（可配）
 * 2) LLM 生成故事
 * 3) 从 sentences 抽样约 20% 做相关性评分
 * 4) 按三档阈值做 id 分桶（见 buildRelevanceBuckets）
 */
export declare function runStorySentenceBucketsFromDb(dbPath: string, opts?: RunStorySentenceBucketsFromDbOpts): Promise<StorySentenceBucketsResult>;
