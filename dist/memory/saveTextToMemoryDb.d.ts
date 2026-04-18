export type SaveTextToMemoryDbOptions = {
    dbPath: string;
    today?: string;
};
/**
 * 输入任意文本，走 article-word-pipeline(v2) 后直接写入 SQLite。
 * 不落地任何中间 JSON 文件。
 */
export declare function saveTextToMemoryDb(text: string, options: SaveTextToMemoryDbOptions): Promise<void>;
