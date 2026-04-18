export declare function appendFeedbackJsonl(logPath: string, row: {
    ts: string;
    sessionKey?: string;
    sessionId?: string;
    sentenceIds: number[];
    validIds: number[];
    updatedCount: number;
    dbError?: string;
}): void;
