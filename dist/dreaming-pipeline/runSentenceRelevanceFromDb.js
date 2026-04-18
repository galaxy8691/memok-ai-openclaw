import { scoreSentenceRelevance, } from "./scoreSentenceRelevance.js";
import { sampleSentencesForRelevance, } from "./sampleSentencesForRelevance.js";
export async function runSentenceRelevanceFromDb(dbPath, story, opts) {
    const { client, model, maxTokens, ...sampleOpts } = opts ?? {};
    const sentences = sampleSentencesForRelevance(dbPath, sampleOpts);
    return scoreSentenceRelevance({
        story,
        sentences,
    }, { client, model, maxTokens });
}
