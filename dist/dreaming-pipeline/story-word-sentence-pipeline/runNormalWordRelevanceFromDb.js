import { sampleNormalWordsForRelevance, } from "./sampleNormalWordsForRelevance.js";
import { scoreNormalWordRelevance, } from "./scoreNormalWordRelevance.js";
export async function runNormalWordRelevanceFromDb(dbPath, story, opts) {
    const { client, model, maxTokens, ...sampleOpts } = opts ?? {};
    const normalWords = sampleNormalWordsForRelevance(dbPath, sampleOpts);
    return scoreNormalWordRelevance({
        story,
        normalWords,
    }, { client, model, maxTokens });
}
