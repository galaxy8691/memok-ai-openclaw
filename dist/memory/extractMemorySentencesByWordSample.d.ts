import Database from "better-sqlite3";
import { z } from "zod";
/** 对外固定契约：仅含 sentences，每项对应 sentences 表四列 */
export declare const MemoryExtractedSentenceSchema: z.ZodObject<{
    id: z.ZodNumber;
    sentence: z.ZodString;
    weight: z.ZodNumber;
    duration: z.ZodNumber;
}, z.core.$strict>;
export declare const MemoryExtractResponseSchema: z.ZodObject<{
    sentences: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        sentence: z.ZodString;
        weight: z.ZodNumber;
        duration: z.ZodNumber;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type MemoryExtractResponse = z.infer<typeof MemoryExtractResponseSchema>;
export type ExtractMemorySentencesOpts = {
    /** 对 words 全表行数取样的比例，默认 0.2 */
    fraction?: number;
};
/**
 * 从 words 表随机抽取约 fraction 比例的行数（至少 1 行，当表非空），
 * 经 word_to_normal_link → normal_words → sentence_to_normal_link → sentences，
 * 返回去重后的句子列表。
 *
 * k 计算：k = max(1, round(n * fraction))，n 为 words 总行数。
 */
export declare function extractMemorySentencesByWordSample(dbOrPath: Database.Database | string, opts?: ExtractMemorySentencesOpts): MemoryExtractResponse;
