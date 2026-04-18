export const INITIAL_TURN_WINDOW = 12;
export const MAX_AGENT_END_CHARS = 3000;
export function shortHash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i += 1) {
        h = Math.imul(31, h) + s.charCodeAt(i);
        h |= 0;
    }
    return (h >>> 0).toString(16);
}
export function extractTextFromContent(content) {
    if (typeof content === "string") {
        return content;
    }
    if (Array.isArray(content)) {
        return content
            .map((part) => {
            if (typeof part === "string") {
                return part;
            }
            if (part && typeof part === "object" && "text" in part) {
                return String(part.text ?? "");
            }
            return "";
        })
            .join("");
    }
    if (content != null) {
        return String(content);
    }
    return "";
}
export function oneLineSnippet(s, maxChars) {
    const one = s.replace(/\s+/g, " ").trim();
    if (one.length <= maxChars) {
        return one;
    }
    return `${one.slice(0, maxChars)}...`;
}
export function collectLabeledTurns(messages) {
    const lines = [];
    for (const m of messages) {
        if (!m || typeof m !== "object") {
            continue;
        }
        const msg = m;
        const role = msg.role;
        if (role !== "user" && role !== "assistant") {
            continue;
        }
        const text = extractTextFromContent(msg.content).trim();
        if (!text) {
            continue;
        }
        const label = role === "user" ? "User" : "OpenClaw";
        lines.push(`${label}: ${text}`);
    }
    return lines;
}
export function stripFencedCodeBlocks(text) {
    return text.replace(/```[\s\S]*?```/g, "[code block omitted]");
}
export function clampToLastChars(text, maxChars) {
    if (text.length <= maxChars) {
        return text;
    }
    return text.slice(-maxChars);
}
