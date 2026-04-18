import { type RunDreamingPipelineFromDbOpts } from "../dreaming-pipeline/runDreamingPipelineFromDb.js";
export type PluginLoggerLike = {
    info?: (msg: string) => void;
    warn?: (msg: string) => void;
    error?: (msg: string) => void;
};
/** 为定时 dreaming 编排层超时；单测可 import 校验行为 */
export declare function raceDreamingPipelinePromise<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T>;
/** 停止由本模块注册的定时任务（网关重载 / 插件禁用时请先调用）。 */
export declare function stopDreamingPipelineCron(): void;
/**
 * 在 OpenClaw 网关进程内按 cron 调度执行 `runDreamingPipelineFromDb`（需网关常驻）。
 * 与系统 crontab 无关；时区由 `timezone` 或本机默认决定。
 */
export declare function registerDreamingPipelineCron(params: {
    logger: PluginLoggerLike;
    dbPath: string;
    pattern: string;
    timezone?: string;
    pipelineOpts?: RunDreamingPipelineFromDbOpts;
    /** 整段 dreaming 超时（毫秒）；`<= 0` 或未传表示不限制 */
    timeoutMs?: number;
}): void;
