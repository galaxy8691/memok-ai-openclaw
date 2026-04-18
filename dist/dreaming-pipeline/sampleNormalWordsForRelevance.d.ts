export type RelevanceNormalWordItem = {
    id: number;
    word: string;
};
export type SampleNormalWordsForRelevanceOpts = {
    /** 对 normal_words 全表行数的抽样比例，默认 0.2 */
    fraction?: number;
};
/**
 * 从 `normal_words` 表随机抽样约 `fraction` 比例（至少 1 条，表非空），返回 `{ id, word }` 列表。
 */
export declare function sampleNormalWordsForRelevance(dbPath: string, opts?: SampleNormalWordsForRelevanceOpts): RelevanceNormalWordItem[];
