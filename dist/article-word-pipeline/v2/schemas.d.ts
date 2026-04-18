import { z } from "zod";
export declare const ArticleCoreWordsDataSchema: z.ZodObject<{
    core_words: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
export declare const ArticleCoreWordNomalizePairSchema: z.ZodObject<{
    original_text: z.ZodString;
    new_text: z.ZodString;
}, z.core.$strict>;
export declare const ArticleCoreWordsNomalizedDataSchema: z.ZodObject<{
    nomalized: z.ZodArray<z.ZodObject<{
        original_text: z.ZodString;
        new_text: z.ZodString;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const ArticleMemorySentenceItemSchema: z.ZodObject<{
    sentence: z.ZodString;
}, z.core.$strict>;
export declare const ArticleMemorySentencesDataSchema: z.ZodObject<{
    sentences: z.ZodArray<z.ZodObject<{
        sentence: z.ZodString;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const ArticleSentenceCoreItemSchema: z.ZodObject<{
    sentence: z.ZodString;
    core_words: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
export declare const ArticleSentenceCoreCombinedDataSchema: z.ZodObject<{
    sentence_core: z.ZodArray<z.ZodObject<{
        sentence: z.ZodString;
        core_words: z.ZodArray<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const AwpV2TupleSchema: z.ZodTuple<[z.ZodObject<{
    sentence_core: z.ZodArray<z.ZodObject<{
        sentence: z.ZodString;
        core_words: z.ZodArray<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>, z.ZodObject<{
    nomalized: z.ZodArray<z.ZodObject<{
        original_text: z.ZodString;
        new_text: z.ZodString;
    }, z.core.$strict>>;
}, z.core.$strict>], null>;
export type ArticleCoreWordsData = z.infer<typeof ArticleCoreWordsDataSchema>;
export type ArticleCoreWordNomalizePair = z.infer<typeof ArticleCoreWordNomalizePairSchema>;
export type ArticleCoreWordsNomalizedData = z.infer<typeof ArticleCoreWordsNomalizedDataSchema>;
export type ArticleMemorySentenceItem = z.infer<typeof ArticleMemorySentenceItemSchema>;
export type ArticleMemorySentencesData = z.infer<typeof ArticleMemorySentencesDataSchema>;
export type ArticleSentenceCoreItem = z.infer<typeof ArticleSentenceCoreItemSchema>;
export type ArticleSentenceCoreCombinedData = z.infer<typeof ArticleSentenceCoreCombinedDataSchema>;
