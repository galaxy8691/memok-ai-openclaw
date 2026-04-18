import Database from "better-sqlite3";
const DEFAULT_MAX_WORDS = 10;
/**
 * 从 `words` 表无放回随机抽取至多 `maxWords` 个词（默认 10），返回 `word` 字符串列表。
 */
export function sampleWordStrings(dbPath, opts) {
    const rawCap = opts?.maxWords ?? DEFAULT_MAX_WORDS;
    const cap = Number.isFinite(rawCap) && rawCap > 0 ? Math.floor(rawCap) : DEFAULT_MAX_WORDS;
    const db = new Database(dbPath, { readonly: true });
    try {
        db.pragma("foreign_keys = ON");
        const countRow = db.prepare("SELECT COUNT(*) as c FROM words").get();
        const n = Number(countRow.c);
        if (n <= 0) {
            throw new Error("words 表为空，无法抽样");
        }
        const k = Math.min(n, cap);
        const rows = db.prepare("SELECT word FROM words ORDER BY RANDOM() LIMIT ?").all(k);
        return rows.map((r) => r.word);
    }
    finally {
        db.close();
    }
}
