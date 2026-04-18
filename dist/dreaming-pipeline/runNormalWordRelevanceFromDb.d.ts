import OpenAI from "openai";
import { type NormalWordRelevanceOutput } from "./scoreNormalWordRelevance.js";
import { type SampleNormalWordsForRelevanceOpts } from "./sampleNormalWordsForRelevance.js";
export type RunNormalWordRelevanceFromDbOpts = SampleNormalWordsForRelevanceOpts & {
    client?: OpenAI;
    model?: string;
    maxTokens?: number;
};
export declare function runNormalWordRelevanceFromDb(dbPath: string, story: string, opts?: RunNormalWordRelevanceFromDbOpts): Promise<NormalWordRelevanceOutput>;
