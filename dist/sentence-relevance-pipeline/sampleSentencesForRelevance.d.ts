export type RelevanceSentenceItem = {
    id: number;
    sentence: string;
};
export type SampleSentencesForRelevanceOpts = {
    /** 对 sentences 全表行数的抽样比例，默认 0.2 */
    fraction?: number;
};
/**
 * 从 `sentences` 表随机抽样约 `fraction` 比例（至少 1 条，表非空），返回 `{id, sentence}` 列表。
 */
export declare function sampleSentencesForRelevance(dbPath: string, opts?: SampleSentencesForRelevanceOpts): RelevanceSentenceItem[];
