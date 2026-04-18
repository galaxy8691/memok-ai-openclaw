import OpenAI from "openai";
import { z } from "zod";
export declare const MergeSentenceOutputSchema: z.ZodObject<{
    sentence: z.ZodString;
}, z.core.$strict>;
export type MergeSentenceOutput = z.infer<typeof MergeSentenceOutputSchema>;
export declare const SYSTEM_PROMPT_MERGE_SENTENCE = "\u4F60\u662F\u53E5\u5B50\u5408\u5E76\u5668\u3002\u8F93\u5165\u5305\u542B\u4E24\u4E2A\u53E5\u5B50\uFF1Abase \u4E0E orphan\u3002\n\u4EFB\u52A1\uFF1A\u628A\u4E24\u53E5\u5408\u5E76\u4E3A\u4E00\u53E5\u66F4\u5B8C\u6574\u3001\u4FE1\u606F\u4E0D\u4E22\u5931\u4E14\u4E0D\u7F16\u9020\u7684\u65B0\u53E5\u3002\n\u89C4\u5219\uFF1A\n1) \u4FDD\u7559\u4E8B\u5B9E\uFF0C\u4E0D\u6DFB\u52A0\u8F93\u5165\u4E4B\u5916\u7684\u65B0\u4E8B\u5B9E\u3002\n2) \u5408\u5E76\u91CD\u53E0\u4FE1\u606F\uFF0C\u907F\u514D\u91CD\u590D\u8D58\u8FF0\u3002\n3) \u8F93\u51FA\u4EC5\u4E00\u4E2A JSON \u5BF9\u8C61\uFF1A{ \"sentence\": \"...\" }\u3002";
export declare function mergeSentenceText(baseSentence: string, orphanSentence: string, opts?: {
    client?: OpenAI;
    model?: string;
    maxTokens?: number;
}): Promise<string>;
