export type SampleWordStringsOpts = {
    /** 最多抽几个词（无放回随机）；默认 10；若表内总行数更少则只抽 `n` 行 */
    maxWords?: number;
};
/**
 * 从 `words` 表无放回随机抽取至多 `maxWords` 个词（默认 10），返回 `word` 字符串列表。
 */
export declare function sampleWordStrings(dbPath: string, opts?: SampleWordStringsOpts): string[];
