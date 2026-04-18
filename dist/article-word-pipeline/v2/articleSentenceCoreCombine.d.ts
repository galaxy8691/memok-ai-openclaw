import { type ArticleCoreWordsNomalizedData, type ArticleMemorySentencesData, type ArticleSentenceCoreCombinedData } from "./schemas.js";
declare function newTextListOrderedDedupe(data: ArticleCoreWordsNomalizedData): string[];
export declare function combineArticleSentenceCoreV2(sentences: ArticleMemorySentencesData, normalized: ArticleCoreWordsNomalizedData): [ArticleSentenceCoreCombinedData, ArticleCoreWordsNomalizedData];
export declare function dumpArticleSentenceCoreCombineTupleV2Json(combined: ArticleSentenceCoreCombinedData, normalized: ArticleCoreWordsNomalizedData, indent?: number | null): string;
export declare const _internalArticleSentenceCoreCombine: {
    newTextListOrderedDedupe: typeof newTextListOrderedDedupe;
};
export {};
