/** 旧版注入标题（无定界符）；落库时仍尝试剥离，兼容历史消息。 */
export declare const MEMOK_MEMORY_INJECT_MARKER = "\u3010memok-ai \u5019\u9009\u8BB0\u5FC6\u3011";
/**
 * 与 `buildMemoryInjectBlock` 配对：整段候选记忆包在起止标记之间，便于 transcript 落库时整段删除，避免回灌 SQLite。
 * 选用 `@@@` + 固定 token，降低与正文偶然碰撞的概率。
 */
export declare const MEMOK_INJECT_START = "@@@MEMOK_RECALL_START@@@";
export declare const MEMOK_INJECT_END = "@@@MEMOK_RECALL_END@@@";
/**
 * 从 transcript 中移除本插件注入的候选记忆：
 * 1) `@@@MEMOK_RECALL_START@@@` … `@@@MEMOK_RECALL_END@@@` 整段；
 * 2) 旧版从 `【memok-ai 候选记忆】` 到下一轮 `User:`/`用户:`/`OpenClaw:` 之前。
 */
export declare function stripMemokInjectEchoFromTranscript(text: string): string;
