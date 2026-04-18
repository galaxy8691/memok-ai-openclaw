import OpenAI from "openai";
import { ArticleCoreWordsNomalizedData, ArticleSentenceCoreCombinedData } from "./schemas.js";
export declare function articleWordPipelineV2(text: string, opts?: {
    client?: OpenAI;
}): Promise<[ArticleSentenceCoreCombinedData, ArticleCoreWordsNomalizedData]>;
