import { Cron } from "croner";
import {
  type DreamingPipelineConfig,
  dreamingPipeline,
  type MemokPipelineConfig,
} from "memok-ai/bridge";

export type PluginLoggerLike = {
  info?: (msg: string) => void;
  warn?: (msg: string) => void;
  error?: (msg: string) => void;
};

let active: Cron | undefined;

/** Stop the cron job registered by this module (e.g. before hot reload; plugin does not wire reload yet). */
export function stopDreamingPipelineCron(): void {
  active?.stop();
  active = undefined;
}

export type DreamingStoryTuning = Pick<
  DreamingPipelineConfig,
  "maxWords" | "fraction" | "minRuns" | "maxRuns" | "pickRunCount"
>;

/**
 * Schedule `dreamingPipeline` inside the OpenClaw gateway process (long-running).
 * Core writes `dream_logs` inside `dreamingPipeline`.
 */
export function registerDreamingPipelineCron(params: {
  logger: PluginLoggerLike;
  pipeline: MemokPipelineConfig;
  pattern: string;
  timezone?: string;
  storyTuning?: DreamingStoryTuning;
}): void {
  stopDreamingPipelineCron();
  const { logger, pipeline, pattern, timezone, storyTuning } = params;

  try {
    const job = new Cron(
      pattern,
      {
        name: "memok-ai-dreaming-pipeline",
        timezone,
        protect: true,
      },
      async () => {
        try {
          logger.info?.(
            `[memok-ai] dreaming-pipeline (scheduled) start: db=${pipeline.dbPath}`,
          );
          const input: DreamingPipelineConfig = {
            ...pipeline,
            ...storyTuning,
            dreamLogWarn: (msg: string) => {
              logger.warn?.(msg);
            },
          };
          const out = await dreamingPipeline(input);
          const p = out.predream;
          const s = out.storyWordSentencePipeline;
          logger.info?.(
            `[memok-ai] dreaming-pipeline (scheduled) done: predream(durationDec=${p.sentencesDurationDecremented} promoted=${p.promotedToLongTerm} deleted=${p.deletedSentences}) storyRuns=${s.plannedRuns}`,
          );
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          logger.error?.(
            `[memok-ai] dreaming-pipeline (scheduled) failed: ${msg}`,
          );
        }
      },
    );
    active = job;
    const next = job.nextRun();
    logger.info?.(
      `[memok-ai] dreaming-pipeline scheduled: cron=${pattern}${timezone ? ` tz=${timezone}` : ""} next=${next?.toISOString() ?? "unknown"}`,
    );
    logger.info?.(
      "[memok-ai] dreaming results are written to SQLite table dream_logs by memok-ai core. (中文：发梦结果由核心写入 dream_logs)",
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error?.(
      `[memok-ai] dreaming-pipeline cron invalid: pattern=${pattern} ${msg}`,
    );
  }
}
