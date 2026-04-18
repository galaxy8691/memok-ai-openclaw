import { z } from "zod";
export declare const ResultLinkFeedbackInputSchema: z.ZodObject<{
    words: z.ZodArray<z.ZodString>;
    buckets: z.ZodObject<{
        words: z.ZodArray<z.ZodString>;
        id_ge_60: z.ZodArray<z.ZodNumber>;
        id_ge_40_lt_60: z.ZodArray<z.ZodNumber>;
        id_lt_40: z.ZodArray<z.ZodNumber>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type ResultLinkFeedbackInput = z.infer<typeof ResultLinkFeedbackInputSchema>;
export type ApplyResultLinkFeedbackResult = {
    matchedNormalIds: number;
    updatedSentenceRows: number;
    updatedPlus: number;
    /** 高分句与 story `words` 推得的 normal_id 之间原本无 sentence_to_normal_link，新建 weight=1 的行数 */
    insertedPlusSentenceLinks: number;
    updatedMinus: number;
    deleted: number;
    skippedConflicts: number;
    targetedPlusSentences: number;
    targetedMinusSentences: number;
};
/**
 * 高分句（`id_ge_60`）：对每个 `(sentence_id, normal_id)`，`normal_id` 来自本轮 `words` 在图上的可达集合；
 * 已有 `sentence_to_normal_link` 则 weight+1，否则 INSERT `weight=1`。
 */
export declare function applyResultLinkFeedback(dbPath: string, input: ResultLinkFeedbackInput): ApplyResultLinkFeedbackResult;
