import type OpenAI from "openai";
import type { z } from "zod";
export declare function loadProjectEnv(): void;
export declare function llmMaxWorkers(): number;
export declare function preferJsonObjectOnly(): boolean;
export declare function isDeepseekCompatibleBaseUrl(): boolean;
type Message = {
    role: "system" | "user" | "assistant";
    content: string;
};
type RunParseOrJsonParams<T> = {
    client: OpenAI;
    model: string;
    messagesParse: Message[];
    messagesJson: Message[];
    schema: z.ZodType<T>;
    responseName: string;
    maxCompletionTokens?: number;
    maxTokens?: number;
};
export declare function runParseOrJson<T>(params: RunParseOrJsonParams<T>): Promise<T>;
export {};
