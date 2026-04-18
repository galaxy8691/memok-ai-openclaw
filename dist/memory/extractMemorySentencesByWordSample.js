import Database from "better-sqlite3";
import { z } from "zod";
/** 对外固定契约：仅含 sentences，每项对应 sentences 表四列 */
export const MemoryExtractedSentenceSchema = z
    .object({
    id: z.number().int(),
    sentence: z.string(),
    weight: z.number().int(),
    duration: z.number().int(),
})
    .strict();
export const MemoryExtractResponseSchema = z
    .object({
    sentences: z.array(MemoryExtractedSentenceSchema),
})
    .strict();
/**
 * 从 words 表随机抽取约 fraction 比例的行数（至少 1 行，当表非空），
 * 经 word_to_normal_link → normal_words → sentence_to_normal_link → sentences，
 * 返回去重后的句子列表。
 *
 * k 计算：k = max(1, round(n * fraction))，n 为 words 总行数。
 */
export function extractMemorySentencesByWordSample(dbOrPath, opts) {
    const fraction = opts?.fraction ?? 0.2;
    const ownDb = typeof dbOrPath === "string";
    const db = ownDb ? new Database(dbOrPath) : dbOrPath;
    try {
        const countRow = db.prepare("SELECT COUNT(*) as c FROM words").get();
        const n = Number(countRow.c);
        if (n <= 0) {
            return MemoryExtractResponseSchema.parse({ sentences: [] });
        }
        const k = Math.max(1, Math.round(n * fraction));
        const sampled = db
            .prepare("SELECT id FROM words ORDER BY RANDOM() LIMIT ?")
            .all(k);
        if (sampled.length === 0) {
            return MemoryExtractResponseSchema.parse({ sentences: [] });
        }
        const wordIds = sampled.map((w) => w.id);
        const placeholders = wordIds.map(() => "?").join(", ");
        const normals = db
            .prepare(`SELECT DISTINCT wtn.normal_id AS id
         FROM word_to_normal_link wtn
         WHERE wtn.word_id IN (${placeholders})`)
            .all(...wordIds);
        if (normals.length === 0) {
            return MemoryExtractResponseSchema.parse({ sentences: [] });
        }
        const normalIds = normals.map((r) => r.id);
        const nPh = normalIds.map(() => "?").join(", ");
        const rows = db
            .prepare(`SELECT DISTINCT s.id, s.sentence, s.weight, s.duration
         FROM sentence_to_normal_link snl
         JOIN sentences s ON s.id = snl.sentence_id
         WHERE snl.normal_id IN (${nPh})`)
            .all(...normalIds);
        return MemoryExtractResponseSchema.parse({ sentences: rows });
    }
    finally {
        if (ownDb) {
            db.close();
        }
    }
}
