import { copyFileSync, existsSync } from "node:fs";
import type { MemokPipelineConfig } from "memok-ai/bridge";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { applyMemokPluginLlmEnv } from "./plugin/applyMemokPluginLlmEnv.js";
import { getMemokExtensionConfigTomlPath } from "./plugin/memokConfigPaths.js";
import {
  assertPipelineDbPathMatchesOpenclaw,
  buildMemokPipelineConfigForWizard,
  loadMemokPipelineConfig,
  writeMemokPipelineToml,
} from "./plugin/memokPipelineConfigToml.js";
import {
  expandUserPath,
  getDefaultDbPath,
  type MemokConfig,
  type MemokPluginEntry,
  resolveMemokDbPathFromConfig,
} from "./plugin/memokTypes.js";
import {
  type MemokRuntimeContext,
  registerMemokPluginRuntime,
} from "./plugin/registerMemokPluginRuntime.js";
import {
  mergeMemokSetupToConfig,
  promptMemokSetupAnswers,
} from "./plugin/setupWizard.js";

export default definePluginEntry({
  id: "memok-ai",
  name: "Memok AI Memory",
  description:
    "Persist OpenClaw chats to the memok-ai memory system. 中文：将 OpenClaw 对话写入 memok-ai 记忆库。",

  register(api: any) {
    api.registerCli(
      ({ program }: any) => {
        const memok = program
          .command("memok")
          .description("memok-ai plugin commands");
        memok
          .command("setup")
          .description(
            "Interactive setup for llm provider/model and dreaming schedule",
          )
          .action(async () => {
            const runtimeConfig = api.runtime?.config;
            if (!runtimeConfig?.loadConfig || !runtimeConfig?.writeConfigFile) {
              throw new Error(
                "memok setup unavailable: runtime config API not ready",
              );
            }
            const answers = await promptMemokSetupAnswers();
            const cur = runtimeConfig.loadConfig() as unknown as Record<
              string,
              unknown
            >;
            const next = mergeMemokSetupToConfig(cur, answers);
            await runtimeConfig.writeConfigFile(next);
            const tomlPath = getMemokExtensionConfigTomlPath();
            const tomlCfg = buildMemokPipelineConfigForWizard(next);
            writeMemokPipelineToml(tomlCfg);
            const dbPath = resolveMemokDbPathFromConfig(next);
            const cleanPath = `${dbPath}.clean`;
            let copiedFromClean = false;
            if (existsSync(cleanPath)) {
              copyFileSync(cleanPath, dbPath);
              copiedFromClean = true;
            }
            console.log(
              [
                "[memok-ai] setup complete: wrote plugins.entries.memok-ai.config",
                `- llmProvider=${answers.llmProvider}`,
                `- model=${answers.llmModel?.trim() ? answers.llmModel.trim() : (answers.llmModelPreset ?? "(unset)")}`,
                "- plugins.slots.memory=memok-ai (wizard pins the memory slot)",
                `- dreamingSchedule=${answers.dreamingPipelineScheduleEnabled ? `on @ ${answers.dreamingPipelineDailyAt ?? "03:00"}` : "off"}`,
                copiedFromClean
                  ? `- copied seed DB from ${cleanPath} to ${dbPath}`
                  : `- no ${cleanPath}; skipped seed DB copy`,
                `- Memok pipeline config: ${tomlPath}`,
                "",
                "Restart the gateway for changes to take effect. 中文：请重启网关使配置生效。",
              ].join("\n"),
            );
          });
      },
      { commands: ["memok"] },
    );

    api.registerCommand({
      name: "memok",
      description: "Show memok setup help",
      acceptsArgs: true,
      handler: async (ctx: any) => {
        const first = (ctx.args ?? "").trim().split(/\s+/)[0] ?? "";
        if (first === "setup") {
          return {
            text: "Run `openclaw memok setup` in the gateway terminal for the interactive wizard (provider / API key / model / dreaming). 中文：请在网关终端执行该命令完成向导。",
          };
        }
        return {
          text: "Usage: `/memok setup` — then run `openclaw memok setup` in the terminal. 中文：用法见上，终端内执行 openclaw memok setup。",
        };
      },
    });

    const entry = api.config.plugins?.entries?.["memok-ai"] as
      | MemokPluginEntry
      | undefined;
    const manifestDefaults =
      api.pluginConfig && typeof api.pluginConfig === "object"
        ? (api.pluginConfig as Record<string, unknown>)
        : {};
    const entryConfig =
      entry?.config && typeof entry.config === "object"
        ? (entry.config as Record<string, unknown>)
        : {};
    const baseDefaults = { ...manifestDefaults };
    // Manifest default `dreamingPipelineCron` is "0 3 * * *". If the user only set
    // `dreamingPipelineDailyAt` in openclaw.json (wizard), omitting cron must not
    // inherit that default — otherwise dailyAt is silently ignored.
    const userCron = entryConfig.dreamingPipelineCron;
    const hasUserCron =
      typeof userCron === "string" && userCron.trim().length > 0;
    const hasUserDailyAt =
      typeof entryConfig.dreamingPipelineDailyAt === "string" &&
      entryConfig.dreamingPipelineDailyAt.trim().length > 0;
    if (hasUserDailyAt && !hasUserCron) {
      delete baseDefaults.dreamingPipelineCron;
    }
    const pluginCfg = {
      ...baseDefaults,
      ...entryConfig,
    } as MemokConfig;

    if (entry?.enabled === false || pluginCfg.enabled === false) {
      api.logger?.info("[memok-ai] plugin disabled (中文：插件已禁用)");
      return;
    }

    applyMemokPluginLlmEnv(pluginCfg, api.logger);
    if (
      (pluginCfg.llmProvider ?? "inherit") !== "inherit" ||
      (pluginCfg.llmApiKey ?? "").trim() ||
      (pluginCfg.llmModel ?? "").trim() ||
      (pluginCfg.llmModelPreset ?? "").trim()
    ) {
      api.logger?.info(
        "[memok-ai] filled missing OPENAI_API_KEY / OPENAI_BASE_URL / MEMOK_LLM_MODEL from plugin config where unset (中文：已按插件配置补缺环境变量，不覆盖已有值)",
      );
    }

    const dbPath = expandUserPath(pluginCfg.dbPath || getDefaultDbPath());
    let pipeline: MemokPipelineConfig;
    try {
      pipeline = loadMemokPipelineConfig();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      api.logger?.error?.(`[memok-ai] ${msg}`);
      return;
    }
    try {
      assertPipelineDbPathMatchesOpenclaw(pipeline, dbPath);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      api.logger?.error?.(
        `[memok-ai] ${msg} Fix dbPath in openclaw.json or rerun openclaw memok setup. (中文：请修正 dbPath 或重新运行 setup)`,
      );
      return;
    }
    const memoryInjectEnabled = pluginCfg.memoryInjectEnabled !== false;
    const rawMode = pluginCfg.memoryRecallMode ?? "skill+hint";
    let memoryRecallMode: MemokConfig["memoryRecallMode"];
    if (
      rawMode === "prepend" ||
      rawMode === "skill" ||
      rawMode === "skill+hint"
    ) {
      memoryRecallMode = rawMode;
    } else {
      api.logger?.warn?.(
        `[memok-ai] unknown memoryRecallMode=${String(rawMode)}; using skill. (中文：未知模式，按 skill 处理)`,
      );
      memoryRecallMode = "skill";
    }
    const extractFraction = pluginCfg.extractFraction ?? 0.2;
    const longTermFraction = pluginCfg.longTermFraction ?? extractFraction;
    const maxInjectChars = Math.max(512, pluginCfg.maxInjectChars ?? 12_000);
    api.logger?.info(
      `[memok-ai] enabled, database: ${dbPath} (中文：已启用，数据库见上)`,
    );
    if (memoryInjectEnabled) {
      api.logger?.info(
        `[memok-ai] recall: mode=${memoryRecallMode}, fraction=${extractFraction}, longTermFraction=${longTermFraction}, maxInjectChars=${maxInjectChars} (中文：记忆召回参数)`,
      );
    }
    const persistTranscriptToMemory =
      pluginCfg.persistTranscriptToMemory !== false;
    if (pluginCfg.persistTranscriptToMemory === false) {
      api.logger?.info(
        "[memok-ai] persistTranscriptToMemory=false: transcripts are not written to SQLite; recall/tools still work. (中文：已关闭对话落库)",
      );
    }

    const runtimeCtx: MemokRuntimeContext = {
      pluginCfg,
      pipeline,
      memoryInjectEnabled,
      memoryRecallMode,
      extractFraction,
      longTermFraction,
      maxInjectChars,
      persistTranscriptToMemory,
    };
    registerMemokPluginRuntime(api, runtimeCtx);
  },
});
