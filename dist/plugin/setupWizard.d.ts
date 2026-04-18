export type MemokLlmProvider = "inherit" | "openai" | "deepseek" | "openrouter" | "moonshot" | "siliconflow" | "ollama" | "custom";
export type MemokSetupAnswers = {
    llmProvider: MemokLlmProvider;
    llmApiKey?: string;
    llmBaseUrl?: string;
    llmModelPreset?: string;
    llmModel?: string;
    dreamingPipelineScheduleEnabled: boolean;
    dreamingPipelineDailyAt?: string;
    dreamingPipelineTimezone?: string;
};
export declare function isValidDailyAt(v: string): boolean;
export declare function promptMemokSetupAnswers(): Promise<MemokSetupAnswers>;
export declare function mergeMemokSetupToConfig(cfg: Record<string, unknown>, answers: MemokSetupAnswers): Record<string, unknown>;
