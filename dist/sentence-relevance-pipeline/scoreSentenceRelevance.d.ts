import OpenAI from "openai";
import { z } from "zod";
export declare const SentenceRelevanceInputSchema: z.ZodObject<{
    story: z.ZodString;
    sentences: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        sentence: z.ZodString;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const SentenceRelevanceOutputSchema: z.ZodObject<{
    sentences: z.ZodArray<z.ZodObject<{
        id: z.ZodNumber;
        score: z.ZodNumber;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type SentenceRelevanceInput = z.infer<typeof SentenceRelevanceInputSchema>;
export type SentenceRelevanceOutput = z.infer<typeof SentenceRelevanceOutputSchema>;
export declare const SYSTEM_PROMPT_SENTENCE_RELEVANCE = "\u4F60\u662F\u76F8\u5173\u6027\u8BC4\u5206\u5668\u3002\u7528\u6237\u4F1A\u7ED9\u4F60\u4E00\u4E2A JSON \u5BF9\u8C61\uFF0C\u5F62\u72B6\u4E3A\uFF1A\n{ \"story\": string, \"sentences\": [{ \"id\": number, \"sentence\": string }] }\n\n\u4EFB\u52A1\uFF1A\u5BF9\u6BCF\u6761 sentence \u4E0E story \u7684\u8BED\u4E49\u76F8\u5173\u6027\u8BC4\u5206\uFF0C0-100 \u7684\u6574\u6570\u3002\n\u8BC4\u5206\u89C4\u5219\uFF08\u5EFA\u8BAE\uFF0C\u504F\u5BBD\u677E\uFF09\uFF1A\n- 80-100\uFF1A\u9AD8\u5EA6\u76F8\u5173\uFF0C\u6838\u5FC3\u8BED\u4E49\u76F4\u63A5\u5339\u914D\n- 55-79\uFF1A\u660E\u663E\u76F8\u5173\uFF0C\u6709\u5B9E\u8D28\u4EA4\u96C6\n- 30-54\uFF1A\u90E8\u5206\u76F8\u5173\uFF0C\u6709\u4E3B\u9898/\u672F\u8BED/\u573A\u666F\u4E0A\u7684\u5173\u8054\n- 10-29\uFF1A\u5F31\u76F8\u5173\uFF0C\u53EA\u6709\u5C11\u91CF\u5173\u8054\u7EBF\u7D22\n- 0-9\uFF1A\u57FA\u672C\u65E0\u5173\n\u6CE8\u610F\uFF1A\u53EA\u8981\u53E5\u5B50\u4E0E story \u5728\u4E3B\u9898\u3001\u672F\u8BED\u3001\u573A\u666F\u3001\u4EFB\u52A1\u80CC\u666F\u4EFB\u4E00\u65B9\u9762\u6709\u53EF\u89E3\u91CA\u5173\u8054\uFF0C\u5C31\u4E0D\u8981\u7ED9 0 \u5206\u3002\n\n\u786C\u6027\u8981\u6C42\uFF1A\n1) \u5FC5\u987B\u53EA\u8F93\u51FA JSON \u5BF9\u8C61\uFF0C\u4E14\u4EC5\u6709\u9876\u5C42\u952E \"sentences\"\u3002\n2) \u6BCF\u4E2A\u8F93\u5165 id \u5FC5\u987B\u4E14\u4EC5\u51FA\u73B0\u4E00\u6B21\uFF1B\u4E0D\u5141\u8BB8\u65B0\u589E\u6216\u7F3A\u5931 id\u3002\n3) score \u5FC5\u987B\u662F 0-100 \u6574\u6570\u3002";
export declare function validateSentenceRelevanceOutput(input: SentenceRelevanceInput, output: SentenceRelevanceOutput): SentenceRelevanceOutput;
export declare function scoreSentenceRelevance(input: SentenceRelevanceInput, opts?: {
    client?: OpenAI;
    model?: string;
    maxTokens?: number;
}): Promise<SentenceRelevanceOutput>;
