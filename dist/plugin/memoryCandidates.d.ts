/** sessionKey（或回退键）→ 最近一轮注入的句子 id，供工具校验与日志 */
export declare const memoryCandidateIdsBySession: Map<string, {
    ids: number[];
    at: number;
}>;
export declare const ReportUsedMemoryIdsParams: import("@sinclair/typebox").TObject<{
    sentenceIds: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TInteger>;
}>;
export declare const RecallCandidateMemoriesParams: import("@sinclair/typebox").TObject<{}>;
export type RecallStoreResult = {
    kind: "empty";
} | {
    kind: "block";
    text: string;
    ids: number[];
    truncated: boolean;
};
/**
 * 抽样并写入本轮 session 的候选 id，供 prepend / 工具 / 反馈校验共用。
 */
export declare function recallAndStoreCandidates(dbPath: string, extractFraction: number, longTermFraction: number, maxInjectChars: number, sessionMemKey: string): RecallStoreResult;
