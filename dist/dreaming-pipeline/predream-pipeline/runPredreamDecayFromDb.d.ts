export type PredreamDecayResult = {
    /** 全局 `duration = duration - 1` 影响的行数 */
    sentencesDurationDecremented: number;
    /** `is_short_term=1` 且 `weight>=7` 被设为长期（`is_short_term=0`），不要求 `duration` */
    promotedToLongTerm: number;
    /** `is_short_term=1` 且 `duration<=0` 且 `weight<7` 被删除的句子条数 */
    deletedSentences: number;
};
/**
 * predream：全表句子 `duration` 减 1；再分流：
 * - 短期且 `weight >= 7` → 直接 `is_short_term = 0`（转长期，不看 `duration`）
 * - 短期且 `duration <= 0` 且 `weight < 7` → 删除句子（先删 `sentence_to_normal_link` 若表存在）
 */
export declare function runPredreamDecayFromDb(dbPath: string): PredreamDecayResult;
