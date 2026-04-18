import type OpenAI from "openai";
import { type SampleSentencesForRelevanceOpts } from "./sampleSentencesForRelevance.js";
import { type SentenceRelevanceOutput } from "./scoreSentenceRelevance.js";
export type RunSentenceRelevanceFromDbOpts = SampleSentencesForRelevanceOpts & {
    client?: OpenAI;
    model?: string;
    maxTokens?: number;
};
export declare function runSentenceRelevanceFromDb(dbPath: string, story: string, opts?: RunSentenceRelevanceFromDbOpts): Promise<SentenceRelevanceOutput>;
