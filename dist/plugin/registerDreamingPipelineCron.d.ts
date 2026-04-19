import { type RunDreamingPipelineFromDbOpts } from "memok-ai/openclaw-bridge";
export type PluginLoggerLike = {
    info?: (msg: string) => void;
    warn?: (msg: string) => void;
    error?: (msg: string) => void;
};
/** 停止由本模块注册的定时任务（例如热重载前可调用；当前插件未单独挂接 reload）。 */
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
}): void;
