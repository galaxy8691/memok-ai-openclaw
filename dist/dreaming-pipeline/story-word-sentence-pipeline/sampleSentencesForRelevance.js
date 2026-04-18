import { openSqlite } from "../../sqlite/openSqlite.js";
const DEFAULT_FRACTION = 0.2;
/**
 * 从 `sentences` 表随机抽样约 `fraction` 比例（至少 1 条，表非空），返回 `{id, sentence}` 列表。
 */
export function sampleSentencesForRelevance(dbPath, opts) {
    const fraction = opts?.fraction ?? DEFAULT_FRACTION;
    const db = openSqlite(dbPath, { readonly: true });
    try {
        db.pragma("foreign_keys = ON");
        const countRow = db
            .prepare("SELECT COUNT(*) as c FROM sentences")
            .get();
        const n = Number(countRow.c);
        if (n <= 0) {
            throw new Error("sentences 表为空，无法抽样");
        }
        const k = Math.max(1, Math.round(n * fraction));
        const rows = db
            .prepare("SELECT id, sentence FROM sentences ORDER BY RANDOM() LIMIT ?")
            .all(k);
        return rows.map((r) => ({ id: r.id, sentence: r.sentence }));
    }
    finally {
        db.close();
    }
}
