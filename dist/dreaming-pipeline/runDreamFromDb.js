import { generateDreamText } from "./generateDreamText.js";
import { sampleWordStrings } from "./sampleWordStrings.js";
/**
 * 从数据库 `words` 表随机抽样至多若干词（默认 10），再调用 LLM 生成梦幻叙事（纯文本）。
 */
export async function runDreamFromDb(dbPath, opts) {
    const { client, model, maxTokens, ...sampleOpts } = opts ?? {};
    const keywords = sampleWordStrings(dbPath, sampleOpts);
    return generateDreamText(keywords, { client, model, maxTokens });
}
