import { ArticleCoreWordsNomalizedDataSchema, ArticleSentenceCoreCombinedDataSchema, } from "./schemas.js";
function newTextListOrderedDedupe(data) {
    const seen = new Set();
    const out = [];
    for (const row of data.nomalized) {
        const t = row.new_text.trim();
        if (!t || seen.has(t)) {
            continue;
        }
        seen.add(t);
        out.push(t);
    }
    return out;
}
export function combineArticleSentenceCoreV2(sentences, normalized) {
    const coreWords = newTextListOrderedDedupe(normalized);
    const rows = [];
    for (const item of sentences.sentences) {
        const s = item.sentence.trim();
        if (!s) {
            continue;
        }
        rows.push({ sentence: s, core_words: [...coreWords] });
    }
    const combined = ArticleSentenceCoreCombinedDataSchema.parse({
        sentence_core: rows,
    });
    return [combined, ArticleCoreWordsNomalizedDataSchema.parse(normalized)];
}
export function dumpArticleSentenceCoreCombineTupleV2Json(combined, normalized, indent = 2) {
    return JSON.stringify([combined, normalized], null, indent === null ? undefined : indent);
}
export const _internalArticleSentenceCoreCombine = {
    newTextListOrderedDedupe,
};
