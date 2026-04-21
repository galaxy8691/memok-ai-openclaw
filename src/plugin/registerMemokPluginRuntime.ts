import { writeFileSync } from "node:fs";
import {
  applySentenceUsageFeedback,
  articleWordPipeline,
  type MemokPipelineConfig,
} from "memok-ai/bridge";
import type { MemokConfig } from "./memokTypes.js";
import { cronPatternFromDailyAt, isMemokSetupCliRun } from "./memokTypes.js";
import {
  memoryCandidateIdsBySession,
  RecallCandidateMemoriesParams,
  ReportUsedMemoryIdsParams,
  recallAndStoreCandidates,
} from "./memoryCandidates.js";
import {
  type DreamingStoryTuning,
  registerDreamingPipelineCron,
} from "./registerDreamingPipelineCron.js";
import { scrubOpenclawHeartbeatArtifacts } from "./scrubOpenclawHeartbeatArtifacts.js";
import { stripMemokInjectEchoFromTranscript } from "./stripMemokInjectEchoFromTranscript.js";
import {
  clampToLastChars,
  collectLabeledTurns,
  INITIAL_TURN_WINDOW,
  MAX_AGENT_END_CHARS,
  oneLineSnippet,
  shortHash,
  stripFencedCodeBlocks,
} from "./transcriptHelpers.js";

const savedKeys = new Set<string>();
const sessionProgress = new Map<
  string,
  { lastCount: number; prefixHash: string }
>();

export type MemokRuntimeContext = {
  pluginCfg: MemokConfig;
  pipeline: MemokPipelineConfig;
  memoryInjectEnabled: boolean;
  memoryRecallMode: NonNullable<MemokConfig["memoryRecallMode"]>;
  extractFraction: number;
  longTermFraction: number;
  maxInjectChars: number;
  persistTranscriptToMemory: boolean;
};

export function registerMemokPluginRuntime(
  api: any,
  ctx: MemokRuntimeContext,
): void {
  const {
    pluginCfg,
    pipeline,
    memoryInjectEnabled,
    memoryRecallMode,
    extractFraction,
    longTermFraction,
    maxInjectChars,
    persistTranscriptToMemory,
  } = ctx;

  if (pluginCfg.dreamingPipelineScheduleEnabled === true) {
    if (isMemokSetupCliRun()) {
      api.logger?.info(
        "[memok-ai] `openclaw memok setup` detected; skipping dreaming cron so the CLI can exit. (中文：setup 流程不注册发梦定时)",
      );
    } else {
      const rawCron =
        typeof pluginCfg.dreamingPipelineCron === "string" &&
        pluginCfg.dreamingPipelineCron.trim()
          ? pluginCfg.dreamingPipelineCron.trim()
          : (cronPatternFromDailyAt(
              pluginCfg.dreamingPipelineDailyAt,
              api.logger,
            ) ?? "0 3 * * *");
      const dreamingTz =
        typeof pluginCfg.dreamingPipelineTimezone === "string" &&
        pluginCfg.dreamingPipelineTimezone.trim()
          ? pluginCfg.dreamingPipelineTimezone.trim()
          : undefined;
      const storyTuning: DreamingStoryTuning = {};
      const mw = pluginCfg.dreamingPipelineMaxWords;
      if (typeof mw === "number" && Number.isFinite(mw)) {
        storyTuning.maxWords = Math.floor(mw);
      }
      const fr = pluginCfg.dreamingPipelineFraction;
      if (typeof fr === "number" && Number.isFinite(fr)) {
        storyTuning.fraction = fr;
      }
      const mn = pluginCfg.dreamingPipelineMinRuns;
      if (typeof mn === "number" && Number.isFinite(mn)) {
        storyTuning.minRuns = Math.floor(mn);
      }
      const mx = pluginCfg.dreamingPipelineMaxRuns;
      if (typeof mx === "number" && Number.isFinite(mx)) {
        storyTuning.maxRuns = Math.floor(mx);
      }
      registerDreamingPipelineCron({
        logger: api.logger ?? {},
        pipeline,
        pattern: rawCron,
        timezone: dreamingTz,
        storyTuning:
          Object.keys(storyTuning).length > 0 ? storyTuning : undefined,
      });
    }
  }

  const runSave = async (
    dedupeKey: string,
    text: string,
    source: "agent_end" | "message_sent",
  ): Promise<void> => {
    let stripped = stripMemokInjectEchoFromTranscript(text.trim());
    stripped = scrubOpenclawHeartbeatArtifacts(stripped);
    if (!stripped) {
      return;
    }
    if (savedKeys.has(dedupeKey)) {
      return;
    }
    savedKeys.add(dedupeKey);
    if (!persistTranscriptToMemory) {
      api.logger?.debug?.(
        `[memok-ai] skip SQLite write (${source}), len=${stripped.length} (中文：已跳过落库)`,
      );
      return;
    }
    const debugFile = `/tmp/memok-ai-input-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}.txt`;
    try {
      writeFileSync(debugFile, stripped, "utf-8");
    } catch {
      // ignore debug dump failures
    }
    api.logger?.info(
      `[memok-ai] persist debug (${source}): len=${stripped.length}, file=${debugFile}, prefix=${JSON.stringify(oneLineSnippet(stripped.slice(0, 500), 260))}, suffix=${JSON.stringify(oneLineSnippet(stripped.slice(-500), 260))}`,
    );
    api.logger?.info(
      `[memok-ai] articleWordPipeline starting (${source})… (中文：记忆管线开始)`,
    );
    try {
      await articleWordPipeline(stripped, pipeline);
      api.logger?.info(
        `[memok-ai] memory saved (${source}). (中文：记忆已保存)`,
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      api.logger?.error(
        `[memok-ai] persist failed (${source}): ${msg}; input_file=${debugFile}; input_len=${stripped.length} (中文：保存失败)`,
      );
      savedKeys.delete(dedupeKey);
    }
  };

  if (memoryInjectEnabled) {
    api.on("before_prompt_build", (_event: any, ctx: any) => {
      try {
        const sessionMemKey = ctx.sessionKey ?? ctx.sessionId ?? "unknown";
        if (memoryRecallMode === "prepend") {
          const r = recallAndStoreCandidates(
            pipeline,
            extractFraction,
            longTermFraction,
            maxInjectChars,
            sessionMemKey,
          );
          if (r.kind === "empty") {
            return;
          }
          if (r.truncated) {
            api.logger?.info(
              `[memok-ai] recall truncated: session=${sessionMemKey}, ids=${r.ids.length}, maxInjectChars=${maxInjectChars} (中文：注入截断)`,
            );
          }
          api.logger?.info(
            `[memok-ai] before_prompt_build: prependContext chars=${r.text.length} session=${sessionMemKey}`,
          );
          return { prependContext: r.text };
        }
        const useSkillHint = memoryRecallMode === "skill+hint";
        const r = recallAndStoreCandidates(
          pipeline,
          extractFraction,
          longTermFraction,
          maxInjectChars,
          sessionMemKey,
        );
        if (r.kind === "empty") {
          api.logger?.info(
            `[memok-ai] before_prompt_build: ${memoryRecallMode} no candidates session=${sessionMemKey} (中文：本轮无候选)`,
          );
          if (useSkillHint) {
            return {
              prependContext:
                "(memok) No candidate memories this turn; call `memok_recall_candidate_memories` to resample. 中文：本轮无候选，可调用该工具再抽样。",
            };
          }
          return;
        }
        if (r.truncated) {
          api.logger?.info(
            `[memok-ai] ${memoryRecallMode} system-context recall truncated: session=${sessionMemKey}, ids=${r.ids.length}, maxInjectChars=${maxInjectChars} (中文：系统上下文注入截断)`,
          );
        }
        const skillLead =
          "(memok) Candidate memories below are attached in **system context** (not user prepend). Follow skill `memok-memory` inside the delimiters; if you use any line, call `memok_report_used_memory_ids` with its ids.\n\n中文：以下为系统侧候选记忆；采用后请上报 id。\n\n";
        const appendSystemContext = `${skillLead}${r.text}`;
        api.logger?.info(
          `[memok-ai] before_prompt_build: appendSystemContext recall chars=${appendSystemContext.length} session=${sessionMemKey}${useSkillHint ? " +prependHint" : ""}`,
        );
        if (useSkillHint) {
          return {
            appendSystemContext,
            prependContext:
              "(memok) Full list is in **system context** delimiters; resample with `memok_recall_candidate_memories`; report with `memok_report_used_memory_ids`. 中文：完整列表在系统上下文定界块内。",
          };
        }
        return { appendSystemContext };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        api.logger?.warn?.(
          `[memok-ai] before_prompt_build recall skipped: ${msg} (中文：召回前置跳过)`,
        );
      }
    });
  }

  if (memoryInjectEnabled) {
    const recallDescription =
      memoryRecallMode === "prepend"
        ? "Sample candidate memory lines from memok SQLite (skill `memok-memory`). In prepend mode a batch is usually injected before load; call again to resample. Returns `[id=…]` lines inside delimiters. 中文：prepend 下可再调用以重新抽样。"
        : "Each turn, the gateway injects the latest candidates into `appendSystemContext` before `before_prompt_build`. Call to resample **within the same turn**. Returns `[id=…]` lines and refreshes round candidate ids. 中文：同轮内需再抽样时调用。";
    api.registerTool(
      (toolCtx: any) => {
        return {
          name: "memok_recall_candidate_memories",
          label: "Memok recall candidates",
          description: recallDescription,
          parameters: RecallCandidateMemoriesParams,
          async execute(_toolCallId: any, _params: Record<string, never>) {
            const sessionMemKey =
              toolCtx.sessionKey ?? toolCtx.sessionId ?? "unknown";
            try {
              const r = recallAndStoreCandidates(
                pipeline,
                extractFraction,
                longTermFraction,
                maxInjectChars,
                sessionMemKey,
              );
              if (r.kind === "empty") {
                return {
                  content: [
                    {
                      type: "text" as const,
                      text: "(memok) No candidate sentences from this sample. 中文：当前抽样无候选。",
                    },
                  ],
                  details: { sentenceIds: [] as number[], empty: true },
                };
              }
              if (r.truncated) {
                api.logger?.info(
                  `[memok-ai] tool recall truncated: session=${sessionMemKey}, ids=${r.ids.length}, maxInjectChars=${maxInjectChars} (中文：工具召回截断)`,
                );
              }
              return {
                content: [{ type: "text" as const, text: r.text }],
                details: { sentenceIds: r.ids, truncated: r.truncated },
              };
            } catch (error: unknown) {
              const msg =
                error instanceof Error ? error.message : String(error);
              api.logger?.warn?.(
                `[memok-ai] memok_recall_candidate_memories failed: ${msg} (中文：召回失败)`,
              );
              return {
                content: [
                  {
                    type: "text" as const,
                    text: `Recall failed: ${msg} 中文：召回失败。`,
                  },
                ],
                details: { error: true },
              };
            }
          },
        };
      },
      { name: "memok_recall_candidate_memories" },
    );
    api.logger?.info(
      `[memok-ai] registered tool memok_recall_candidate_memories (memoryRecallMode=${memoryRecallMode})`,
    );
  }

  if (memoryInjectEnabled) {
    api.registerTool(
      (toolCtx: any) => {
        const reportDescription =
          memoryRecallMode === "prepend"
            ? "Call when you **actually used** candidate lines wrapped in `@@@MEMOK_RECALL_START@@@` … `@@@MEMOK_RECALL_END@@@`. Pass numeric ids from `[id=…]`. Do not call if none were used. 中文：仅在实际采用候选时上报 id。"
            : "Call when you **actually used** a candidate from system context or from `memok_recall_candidate_memories` output (`[id=…]`). Do not call if none were used. 中文：采用系统或工具返回的候选时上报。";
        return {
          name: "memok_report_used_memory_ids",
          label: "Memok usage feedback",
          description: reportDescription,
          parameters: ReportUsedMemoryIdsParams,
          async execute(_toolCallId: any, params: { sentenceIds?: number[] }) {
            const raw = params?.sentenceIds;
            const sentenceIds = Array.isArray(raw)
              ? raw.filter(
                  (n): n is number =>
                    typeof n === "number" && Number.isInteger(n) && n > 0,
                )
              : [];
            const sessionMemKey =
              toolCtx.sessionKey ?? toolCtx.sessionId ?? "unknown";
            const candidate = memoryCandidateIdsBySession.get(sessionMemKey);
            const roundIds = candidate?.ids;
            const hasRoundCandidates = (roundIds?.length ?? 0) > 0;
            const allowedSet = hasRoundCandidates ? new Set(roundIds) : null;
            const validIds = allowedSet
              ? sentenceIds.filter((id) => allowedSet.has(id))
              : sentenceIds;
            if (sentenceIds.length > 0 && allowedSet) {
              const outsiders = sentenceIds.filter((id) => !allowedSet.has(id));
              if (outsiders.length > 0) {
                api.logger?.warn?.(
                  `[memok-ai] memok_report_used_memory_ids: ids not in this round's candidates: ${outsiders.join(", ")} (中文：部分 id 不在本轮候选内)`,
                );
              }
            }
            let updatedCount = 0;
            if (validIds.length > 0) {
              try {
                ({ updatedCount } = applySentenceUsageFeedback({
                  ...pipeline,
                  sentenceIds: validIds,
                }));
              } catch (error: unknown) {
                const msg =
                  error instanceof Error ? error.message : String(error);
                api.logger?.error(
                  `[memok-ai] feedback DB write failed: ${msg} (中文：写库失败)`,
                );
                return {
                  content: [
                    {
                      type: "text" as const,
                      text: `Failed to update memory DB: ${msg} 中文：更新失败。`,
                    },
                  ],
                  details: { error: true, sentenceIds, validIds },
                };
              }
            }
            const text =
              sentenceIds.length === 0
                ? "No ids reported (empty array). Correct if you used no candidates; otherwise pass ids. 中文：空数组在未采用候选时正确。"
                : validIds.length === 0
                  ? "None of the reported ids matched this round's verifiable list; DB unchanged. 中文：id 均不可校验，未更新库。"
                  : `Updated ${updatedCount} sentence row(s) (weight +1; per-day duration rules apply). 中文：已更新句子权重/时长规则见核心文档。`;
            return {
              content: [{ type: "text" as const, text }],
              details: {
                recorded: validIds.length,
                updatedCount,
                sentenceIds,
                validIds,
              },
            };
          },
        };
      },
      { name: "memok_report_used_memory_ids" },
    );
    api.logger?.info("[memok-ai] registered tool memok_report_used_memory_ids");
  }

  api.on("agent_end", (event: any, hookCtx: any) => {
    if (!event.success) {
      return;
    }
    const turns = collectLabeledTurns(event.messages ?? []);
    if (turns.length === 0) {
      return;
    }
    const sessionId = hookCtx.sessionKey ?? hookCtx.sessionId ?? "nosession";
    const state = sessionProgress.get(sessionId);
    let startIdx = 0;
    if (!state) {
      startIdx = Math.max(0, turns.length - INITIAL_TURN_WINDOW);
    } else if (turns.length <= state.lastCount) {
      return;
    } else {
      const prevPrefixHash = shortHash(
        turns.slice(0, state.lastCount).join("\n\n"),
      );
      if (prevPrefixHash === state.prefixHash) {
        startIdx = state.lastCount;
      } else {
        startIdx = Math.max(0, turns.length - INITIAL_TURN_WINDOW);
        api.logger?.info(
          `[memok-ai] transcript prefix changed; reset window: session=${sessionId}, turns=${turns.length}, lastCount=${state.lastCount} (中文：历史重写，回退窗口)`,
        );
      }
    }

    const delta = turns.slice(startIdx).join("\n\n");
    const cleaned = stripFencedCodeBlocks(delta);
    const transcript = clampToLastChars(cleaned, MAX_AGENT_END_CHARS).trim();
    if (!transcript) {
      return;
    }
    const dedupeKey = `ae:${sessionId}:${startIdx}:${turns.length}:${shortHash(transcript)}`;

    sessionProgress.set(sessionId, {
      lastCount: turns.length,
      prefixHash: shortHash(turns.join("\n\n")),
    });

    void runSave(dedupeKey, transcript, "agent_end");
  });

  api.on("message_sent", (event: any, hookCtx: any) => {
    if (!event.success) {
      return;
    }
    const content = event.content?.trim() ?? "";
    if (!content) {
      return;
    }
    const dedupeKey = `ms:${hookCtx.conversationId ?? event.to}:${content.slice(0, 280)}`;
    void runSave(dedupeKey, `OpenClaw:\n${content}`, "message_sent");
  });
}
