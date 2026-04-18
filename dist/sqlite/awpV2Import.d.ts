import type Database from "better-sqlite3";
import { type ArticleCoreWordsNomalizedData, type ArticleSentenceCoreCombinedData } from "../article-word-pipeline/v2/schemas.js";
export declare function parseAwpV2TupleJson(data: unknown): [ArticleSentenceCoreCombinedData, ArticleCoreWordsNomalizedData];
export declare function importAwpV2Tuple(db: Database.Database, sentenceCore: ArticleSentenceCoreCombinedData, normalized: ArticleCoreWordsNomalizedData, opts?: {
    today?: string;
}): void;
export declare function importAwpV2TupleFromPaths(jsonPath: string, dbPath: string, opts?: {
    today?: string;
}): void;
