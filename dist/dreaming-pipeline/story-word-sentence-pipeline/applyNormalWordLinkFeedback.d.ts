import { z } from "zod";
export declare const NormalWordLinkFeedbackInputSchema: z.ZodObject<{
    words: z.ZodArray<z.ZodString>;
    normalWordBuckets: z.ZodObject<{
        id_ge_60: z.ZodArray<z.ZodNumber>;
        id_ge_40_lt_60: z.ZodArray<z.ZodNumber>;
        id_lt_40: z.ZodArray<z.ZodNumber>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type NormalWordLinkFeedbackInput = z.infer<typeof NormalWordLinkFeedbackInputSchema>;
export type ApplyNormalWordLinkFeedbackResult = {
    matchedWordIds: number;
    updatedPlus: number;
    /** 高分 normal_id 与本轮 story `words` 之间原本无 link，新建 weight=1 的行数 */
    insertedPlusLinks: number;
    updatedMinus: number;
    deleted: number;
    skippedConflicts: number;
    targetedPlusNormalWords: number;
    targetedMinusNormalWords: number;
};
/**
 * 根据 normal_word 分桶与本轮故事关键词 `words`，回写 `word_to_normal_link`：
 * - `id_ge_60` 的 normal_id：已有 link 则 weight + 1；与本轮 `words` 对应 `word_id` 尚无 link 则 **INSERT weight=1**
 * - `id_lt_40` 的 normal_id：weight - 1；若 weight <= 0 则删除该行
 * - 同一 normal_id 同时出现在高低分桶则跳过（与句子侧冲突规则一致）
 */
export declare function applyNormalWordLinkFeedback(dbPath: string, input: NormalWordLinkFeedbackInput): ApplyNormalWordLinkFeedbackResult;
