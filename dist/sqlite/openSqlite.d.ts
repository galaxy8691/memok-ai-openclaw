import Database from "better-sqlite3";
/** 与网关多请求 / 定时任务并发时减少 SQLITE_BUSY 等待（毫秒）。 */
export declare const SQLITE_BUSY_TIMEOUT_MS = 5000;
/**
 * 打开文件连接后设置 `busy_timeout` 与 WAL，降低并发读写阻塞。
 * 若某 pragma 失败则调用 `warn`（若提供）并继续，避免在极少数环境下直接崩溃。
 */
export declare function applyRecommendedSqlitePragmas(db: Database.Database, warn?: (msg: string) => void): void;
type DatabaseOptions = NonNullable<ConstructorParameters<typeof Database>[1]>;
/**
 * `new Database(path, options)` 并应用 {@link applyRecommendedSqlitePragmas}。
 */
export declare function openSqlite(path: string, dbOptions?: DatabaseOptions, pragmaWarn?: (msg: string) => void): Database.Database;
export {};
