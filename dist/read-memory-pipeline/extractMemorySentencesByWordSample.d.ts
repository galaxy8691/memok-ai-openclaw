import type Database from "better-sqlite3";
import { z } from "zod";
/** 经本次 words 抽样、经哪条「词 → 规范词」边连到该句（仅保留抽样顺序下最先命中的那一对） */
export declare const WordMatchLinkSchema: z.ZodObject<{
    word: z.ZodString;
    normal_word: z.ZodString;
}, z.core.$strict>;
export type WordMatchLink = z.infer<typeof WordMatchLinkSchema>;
/** 单条句子（与 sentences 表核心列一致；不含 duration_change_times 等扩展列；is_short_term 以 JSON bool 输出） */
export declare const MemoryExtractedSentenceSchema: z.ZodObject<{
    id: z.ZodNumber;
    sentence: z.ZodString;
    weight: z.ZodNumber;
    duration: z.ZodNumber;
    is_short_term: z.ZodPipe<z.ZodUnion<readonly [z.ZodNumber, z.ZodBoolean]>, z.ZodTransform<boolean, number | boolean>>;
    matched_word: z.ZodObject<{
        word: z.ZodString;
        normal_word: z.ZodString;
    }, z.core.$strict>;
}, z.core.$strict>;
export type MemoryExtractedSentence = z.infer<typeof MemoryExtractedSentenceSchema>;
export declare const MemoryExtractResponseSchema: z.ZodObject<{
    sentences: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        sentence: z.ZodString;
        weight: z.ZodNumber;
        duration: z.ZodNumber;
        is_short_term: z.ZodPipe<z.ZodUnion<readonly [z.ZodNumber, z.ZodBoolean]>, z.ZodTransform<boolean, number | boolean>>;
        matched_word: z.ZodObject<{
            word: z.ZodString;
            normal_word: z.ZodString;
        }, z.core.$strict>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type MemoryExtractResponse = z.infer<typeof MemoryExtractResponseSchema>;
export type ExtractMemorySentencesOpts = {
    /** 对 words 全表行数取样的比例，默认 0.2 */
    fraction?: number;
    /**
     * 非短期句池上的抽样比例，默认与 fraction 相同（例如 0.2）。
     * 抽取条数 k = max(1, round(非短期候选数 * longTermFraction))，且不超过池大小。
     */
    longTermFraction?: number;
};
/**
 * 从 words 表随机抽取约 `fraction` 比例的行（至少 1 行，表非空），
 * 经 word_to_normal_link → sentence_to_normal_link → sentences 得到候选句；
 * - **短期**（is_short_term）：候选中全部保留，在 `sentences` 数组前段（顺序与候选迭代一致）；
 * - **非短期**：候选中按 `weight+duration` 加权、无放回随机抽取约 `longTermFraction`（默认同 fraction），
 *   接在 `sentences` 数组后段。
 * 每条 `matched_word` 为本次抽样词 id 顺序下最先能连到该句的一对（`word` / `normal_word`）；同 rank 时保留先合并到的那条。
 */
export declare function extractMemorySentencesByWordSample(dbOrPath: Database.Database | string, opts?: ExtractMemorySentencesOpts): MemoryExtractResponse;
