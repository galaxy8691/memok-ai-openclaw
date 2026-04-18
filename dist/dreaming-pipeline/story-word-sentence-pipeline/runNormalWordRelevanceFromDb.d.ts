import type OpenAI from "openai";
import { type SampleNormalWordsForRelevanceOpts } from "./sampleNormalWordsForRelevance.js";
import { type NormalWordRelevanceOutput } from "./scoreNormalWordRelevance.js";
export type RunNormalWordRelevanceFromDbOpts = SampleNormalWordsForRelevanceOpts & {
    client?: OpenAI;
    model?: string;
    maxTokens?: number;
};
export declare function runNormalWordRelevanceFromDb(dbPath: string, story: string, opts?: RunNormalWordRelevanceFromDbOpts): Promise<NormalWordRelevanceOutput>;
