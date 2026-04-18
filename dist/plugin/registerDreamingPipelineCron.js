import { Cron } from "croner";
import { runDreamingPipelineFromDb, } from "../dreaming-pipeline/runDreamingPipelineFromDb.js";
import { openSqlite } from "../sqlite/openSqlite.js";
let active;
/** 为定时 dreaming 编排层超时；单测可 import 校验行为 */
export function raceDreamingPipelinePromise(promise, timeoutMs, label) {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
        return promise;
    }
    return new Promise((resolve, reject) => {
        const t = setTimeout(() => {
            reject(new Error(`${label} 超过 ${timeoutMs}ms 未结束（可在 plugins.entries.memok-ai.config 调整 dreamingPipelineTimeoutMs，或设为 0 关闭编排超时）`));
        }, timeoutMs);
        promise.then((v) => {
            clearTimeout(t);
            resolve(v);
        }, (e) => {
            clearTimeout(t);
            reject(e);
        });
    });
}
/** 停止由本模块注册的定时任务（网关重载 / 插件禁用时请先调用）。 */
export function stopDreamingPipelineCron() {
    active?.stop();
    active = undefined;
}
/**
 * 在 OpenClaw 网关进程内按 cron 调度执行 `runDreamingPipelineFromDb`（需网关常驻）。
 * 与系统 crontab 无关；时区由 `timezone` 或本机默认决定。
 */
export function registerDreamingPipelineCron(params) {
    stopDreamingPipelineCron();
    const { logger, dbPath, pattern, timezone, pipelineOpts, timeoutMs } = params;
    const insertDreamLog = (row) => {
        try {
            const db = openSqlite(dbPath, undefined, (m) => logger.warn?.(m));
            try {
                db.pragma("foreign_keys = ON");
                db.exec(`CREATE TABLE IF NOT EXISTS dream_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dream_date TEXT NOT NULL,
            ts TEXT NOT NULL,
            status TEXT NOT NULL,
            log_json TEXT NOT NULL
          )`);
                const dreamDate = new Date().toISOString().slice(0, 10);
                const ts = typeof row.ts === "string" ? row.ts : new Date().toISOString();
                const status = String(row.status ?? "unknown");
                db.prepare(`INSERT INTO dream_logs (dream_date, ts, status, log_json)
           VALUES (?, ?, ?, ?)`).run(dreamDate, ts, status, JSON.stringify(row));
            }
            finally {
                db.close();
            }
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            logger.warn?.(`[memok-ai] dream_logs 写库失败: ${msg}`);
        }
    };
    try {
        const job = new Cron(pattern, {
            name: "memok-ai-dreaming-pipeline",
            timezone,
            protect: true,
        }, async () => {
            const startedAt = new Date().toISOString();
            try {
                logger.info?.(`[memok-ai] dreaming-pipeline（定时）开始: db=${dbPath}`);
                if (typeof timeoutMs === "number" && timeoutMs > 0) {
                    logger.info?.(`[memok-ai] dreaming-pipeline（定时）编排超时: ${timeoutMs}ms`);
                }
                const out = await raceDreamingPipelinePromise(runDreamingPipelineFromDb(dbPath, pipelineOpts), timeoutMs ?? 0, "[memok-ai] dreaming-pipeline（定时）");
                const p = out.predream;
                const s = out.storyWordSentencePipeline;
                logger.info?.(`[memok-ai] dreaming-pipeline（定时）完成: predream(durationDec=${p.sentencesDurationDecremented} promoted=${p.promotedToLongTerm} deleted=${p.deletedSentences}) storyRuns=${s.plannedRuns}`);
                insertDreamLog({
                    ts: startedAt,
                    status: "ok",
                    dbPath,
                    predream: p,
                    storyWordSentencePipeline: {
                        minRuns: s.minRuns,
                        maxRuns: s.maxRuns,
                        plannedRuns: s.plannedRuns,
                        orphanNormalWordsDeleted: s.orphanNormalWordsDeleted,
                        orphanSentenceMerge: s.orphanSentenceMerge,
                        sentenceLinkFeedback: s.sentenceLinkFeedback,
                        normalWordLinkFeedback: s.normalWordLinkFeedback,
                    },
                });
            }
            catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                logger.error?.(`[memok-ai] dreaming-pipeline（定时）失败: ${msg}`);
                insertDreamLog({
                    ts: startedAt,
                    status: "error",
                    dbPath,
                    error: msg,
                });
            }
        });
        active = job;
        const next = job.nextRun();
        logger.info?.(`[memok-ai] dreaming-pipeline 已调度: cron=${pattern}${timezone ? ` tz=${timezone}` : ""} 下次=${next?.toISOString() ?? "unknown"}`);
        logger.info?.("[memok-ai] dreaming 结果将写入 SQLite 表 dream_logs");
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        logger.error?.(`[memok-ai] dreaming-pipeline 定时无效: pattern=${pattern} ${msg}`);
    }
}
