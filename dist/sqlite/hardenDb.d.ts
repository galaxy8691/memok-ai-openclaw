import type Database from "better-sqlite3";
/**
 * 数据库结构加固（幂等）：
 * - 清理明显无效 link（word_to_normal_link.normal_id 为 NULL）
 * - 去重 link 关系（保留最小 id）
 * - 建立外键列索引与组合唯一索引，防止重复关系并提升联查/删除性能
 */
export declare function hardenDb(db: Database.Database): void;
export declare function hardenDbFile(dbPath: string): void;
