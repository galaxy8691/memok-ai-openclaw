import { readFileSync } from "node:fs";
import { z } from "zod";
import { openSqlite } from "../../sqlite/openSqlite.js";
import { mergeSentenceText } from "./mergeSentenceText.js";
import { SentenceRelevanceOutputSchema } from "./scoreSentenceRelevance.js";
export const ResultJsonForTopSentenceSchema = z
    .object({
    relevance: SentenceRelevanceOutputSchema,
})
    .strict();
function pickTopSentenceId(result) {
    const rows = result.relevance.sentences;
    if (rows.length === 0) {
        throw new Error("result.relevance.sentences 为空，无法定位最高分句子");
    }
    let best = rows[0];
    for (let i = 1; i < rows.length; i += 1) {
        const cur = rows[i];
        if (cur.score > best.score ||
            (cur.score === best.score && cur.id < best.id)) {
            best = cur;
        }
    }
    return best.id;
}
export async function mergeOrphanSentencesIntoTopScored(dbPath, resultJsonPath, opts) {
    const raw = JSON.parse(readFileSync(resultJsonPath, "utf-8"));
    const parsed = ResultJsonForTopSentenceSchema.parse({
        relevance: raw?.relevance,
    });
    const topSentenceId = pickTopSentenceId(parsed);
    const mergeFn = opts?.mergeFn ?? mergeSentenceText;
    const db = openSqlite(dbPath);
    try {
        db.pragma("foreign_keys = ON");
        const topRow = db
            .prepare("SELECT id, sentence FROM sentences WHERE id = ?")
            .get(topSentenceId);
        if (!topRow) {
            throw new Error(`最高分句子不存在于数据库: id=${topSentenceId}`);
        }
        const orphanRows = db
            .prepare(`SELECT s.id, s.sentence
         FROM sentences s
         LEFT JOIN sentence_to_normal_link snl ON snl.sentence_id = s.id
         WHERE snl.sentence_id IS NULL`)
            .all();
        const orphans = orphanRows.filter((r) => r.id !== topSentenceId);
        if (orphans.length === 0) {
            return {
                topSentenceId,
                orphansFound: 0,
                mergedCount: 0,
                deletedCount: 0,
            };
        }
        let mergedSentence = topRow.sentence;
        let mergedCount = 0;
        let deletedCount = 0;
        const updateTop = db.prepare("UPDATE sentences SET sentence = ? WHERE id = ?");
        const deleteOne = db.prepare("DELETE FROM sentences WHERE id = ?");
        const tx = db.transaction((orphanId, newTopSentence) => {
            updateTop.run(newTopSentence, topSentenceId);
            const d = Number(deleteOne.run(orphanId).changes);
            return d;
        });
        for (const orphan of orphans) {
            const next = await mergeFn(mergedSentence, orphan.sentence);
            const deleted = tx(orphan.id, next);
            mergedSentence = next;
            mergedCount += 1;
            deletedCount += deleted;
        }
        return {
            topSentenceId,
            orphansFound: orphans.length,
            mergedCount,
            deletedCount,
        };
    }
    finally {
        db.close();
    }
}
