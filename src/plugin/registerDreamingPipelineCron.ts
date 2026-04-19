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

/** 停止由本模块注册的定时任务（例如热重载前可调用；当前插件未单独挂接 reload）。 */
export function stopDreamingPipelineCron(): void {
  active?.stop();
  active = undefined;
}

export type DreamingStoryTuning = Pick<
  DreamingPipelineConfig,
  "maxWords" | "fraction" | "minRuns" | "maxRuns" | "pickRunCount"
>;

/**
 * 在 OpenClaw 网关进程内按 cron 调度执行 `dreamingPipeline`（需网关常驻）。
 * `dream_logs` 由核心在 `dreamingPipeline` 内写入。
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
            `[memok-ai] dreaming-pipeline（定时）开始: db=${pipeline.dbPath}`,
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
            `[memok-ai] dreaming-pipeline（定时）完成: predream(durationDec=${p.sentencesDurationDecremented} promoted=${p.promotedToLongTerm} deleted=${p.deletedSentences}) storyRuns=${s.plannedRuns}`,
          );
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          logger.error?.(`[memok-ai] dreaming-pipeline（定时）失败: ${msg}`);
        }
      },
    );
    active = job;
    const next = job.nextRun();
    logger.info?.(
      `[memok-ai] dreaming-pipeline 已调度: cron=${pattern}${timezone ? ` tz=${timezone}` : ""} 下次=${next?.toISOString() ?? "unknown"}`,
    );
    logger.info?.(
      "[memok-ai] dreaming 结果由核心库写入 SQLite 表 dream_logs（dreamingPipeline）",
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error?.(
      `[memok-ai] dreaming-pipeline 定时无效: pattern=${pattern} ${msg}`,
    );
  }
}
