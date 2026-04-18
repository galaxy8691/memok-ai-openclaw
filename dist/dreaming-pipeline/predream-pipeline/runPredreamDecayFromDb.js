import { openSqlite } from "../../sqlite/openSqlite.js";
function tableExists(db, name) {
    const row = db
        .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
        .get(name);
    return row !== undefined;
}
/**
 * predream：全表句子 `duration` 减 1；再分流：
 * - 短期且 `weight >= 7` → 直接 `is_short_term = 0`（转长期，不看 `duration`）
 * - 短期且 `duration <= 0` 且 `weight < 7` → 删除句子（先删 `sentence_to_normal_link` 若表存在）
 */
export function runPredreamDecayFromDb(dbPath) {
    const db = openSqlite(dbPath);
    try {
        db.pragma("foreign_keys = ON");
        const runTx = db.transaction(() => {
            const dec = db
                .prepare("UPDATE sentences SET duration = duration - 1")
                .run();
            const sentencesDurationDecremented = dec.changes;
            const promote = db
                .prepare(`UPDATE sentences SET is_short_term = 0
           WHERE COALESCE(is_short_term, 0) = 1 AND weight >= 7`)
                .run();
            const promotedToLongTerm = promote.changes;
            if (tableExists(db, "sentence_to_normal_link")) {
                db.prepare(`DELETE FROM sentence_to_normal_link
           WHERE sentence_id IN (
             SELECT id FROM sentences
             WHERE COALESCE(is_short_term, 0) = 1 AND duration <= 0 AND weight < 7
           )`).run();
            }
            const del = db
                .prepare(`DELETE FROM sentences
           WHERE COALESCE(is_short_term, 0) = 1 AND duration <= 0 AND weight < 7`)
                .run();
            const deletedSentences = del.changes;
            return {
                sentencesDurationDecremented,
                promotedToLongTerm,
                deletedSentences,
            };
        });
        return runTx();
    }
    finally {
        db.close();
    }
}
