export declare const INITIAL_TURN_WINDOW = 12;
export declare const MAX_AGENT_END_CHARS = 3000;
export declare function shortHash(s: string): string;
export declare function extractTextFromContent(content: unknown): string;
export declare function oneLineSnippet(s: string, maxChars: number): string;
export declare function collectLabeledTurns(messages: unknown[]): string[];
export declare function stripFencedCodeBlocks(text: string): string;
export declare function clampToLastChars(text: string, maxChars: number): string;
