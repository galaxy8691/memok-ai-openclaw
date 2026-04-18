import { z } from "zod";
export declare const ResultJsonForTopSentenceSchema: z.ZodObject<{
    relevance: z.ZodObject<{
        sentences: z.ZodArray<z.ZodObject<{
            id: z.ZodNumber;
            score: z.ZodNumber;
        }, z.core.$strict>>;
    }, z.core.$strict>;
}, z.core.$strict>;
export type MergeOrphanResult = {
    topSentenceId: number;
    orphansFound: number;
    mergedCount: number;
    deletedCount: number;
};
type MergeFn = (baseSentence: string, orphanSentence: string) => Promise<string>;
export declare function mergeOrphanSentencesIntoTopScored(dbPath: string, resultJsonPath: string, opts?: {
    mergeFn?: MergeFn;
}): Promise<MergeOrphanResult>;
export {};
