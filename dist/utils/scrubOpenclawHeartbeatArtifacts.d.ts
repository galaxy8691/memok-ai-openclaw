import type { ArticleCoreWordsNomalizedData, ArticleSentenceCoreCombinedData } from "../article-word-pipeline/v2/schemas.js";
/**
 * OpenClaw 对 `HEARTBEAT_OK`、`HEARTBEAT.md` 及心跳轮次有特殊语义；
 * 正文若含相同子串，易在下游（插件 / 网关）被误触发。先删模板再对残留子串断字。
 */
export declare function scrubOpenclawHeartbeatArtifacts(text: string): string;
/** 对 v2 二元组中所有用户可见字符串字段做 HEARTBEAT* 脱敏（写入 SQLite / 插件前调用）。 */
export declare function scrubHeartbeatInAwpTuple(tuple: readonly [
    ArticleSentenceCoreCombinedData,
    ArticleCoreWordsNomalizedData
]): [ArticleSentenceCoreCombinedData, ArticleCoreWordsNomalizedData];
