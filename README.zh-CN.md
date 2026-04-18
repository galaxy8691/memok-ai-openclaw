# memok-ai

[English](./README.md) | 简体中文 · 官网：[memok-ai.com](https://www.memok-ai.com/)

**Gitee 镜像（中文 / 境内安装入口）：** [gitee.com/wik20/memok-ai-openclaw](https://gitee.com/wik20/memok-ai-openclaw)。下文安装命令中的脚本与 `git clone` 均指向本仓库 Gitee 镜像（`wik20/memok-ai-openclaw`）。若你使用 fork 后的地址，请自行替换 URL。在 Gitee 网页端可将仓库 **「展示 README」** 设为 `README.zh-CN.md`，便于只阅读中文版。

**双远端推送（示例）：** `git remote add gitee https://gitee.com/wik20/memok-ai-openclaw.git`（若尚未添加），之后与 GitHub 相同分支一并推送即可，例如 `git push origin main` 与 `git push gitee main`（将 `origin` / `gitee` 换成你的 remote 名）。Gitee 与 GitHub 可保持同一分支内容；仅首页展示语言通过上述 README 设置区分。

本 npm 包（`name: memok-ai`）仅为 **OpenClaw 网关插件**。记忆引擎（文章流水线、SQLite、dreaming、`memok-ai` CLI）在 **[galaxy8691/memok-ai](https://github.com/galaxy8691/memok-ai)**，在本仓以依赖 **`memok-ai-core`** 安装（`git+https://github.com/galaxy8691/memok-ai.git#v1.1.0`；含 `prepare` 会执行 `npm run build`，首次安装会编译 **`better-sqlite3`**）。`package-lock.json` 使用 HTTPS 解析，便于 CI/无 SSH 环境拉取。

**本仓库**（[GitHub](https://github.com/galaxy8691/memok-ai-openclaw)、[Gitee 镜像](https://gitee.com/wik20/memok-ai-openclaw)）只含薄插件源码（`src/plugin.ts`、`openclaw.plugin.json`、skills）。文档里的 `git clone` / raw 脚本默认指向 **memok-ai-openclaw**。

## 功能概览（本仓）

- OpenClaw 钩子：对话落库、按轮召回、工具 `memok_recall_candidate_memories` / `memok_report_used_memory_ids`、可选发梦定时任务
- `openclaw memok setup` 交互向导与配置写入
- 具体记忆管线由 **`memok-ai-core`** 的稳定入口 **`memok-ai-core/openclaw-bridge`** 提供

**效果验证（经测试）：** 在 OpenClaw 插件召回与上报流程下，记忆实用率（候选记忆在助手回复中被实际用到的比例）**超过 95%**（我们自测场景）。实际表现会因模型、任务与抽样参数而有所不同。

### OpenClaw 插件能帮你做什么

- 按轮召回：可在每轮回复前注入抽样候选，长对话不必每次整段粘贴历史。
- 强化：通过 `memok_report_used_memory_ids` 上报所用句 id，权重递增，常用记忆更易被抽到。
- Dreaming / predream：可选定时任务做衰减、合并与清理，更像对图做维护，而不是无限追加日志。

### 与「纯向量库」路线的差异

| | memok-ai | 常见托管向量库 |
| --- | --- | --- |
| 部署 | 本机 SQLite | 云端 API + 计费 |
| 召回依据 | 词 / 规范词图、权重、抽样 | 向量相似度 |
| 可解释性 | 结构化表可排查 | 多为相似度分数 |
| 隐私 | 默认数据不出机 | 通常需上传宿主外 |

这是取舍，不是断言检索效果一定优于或劣于向量方案。

### 来自重度使用的反馈（非基准测试）

社区与长期使用者反馈包括：跨会话跟进（性能、架构、发布流程等话题）、在明确引用记忆时上报与权重更新行为符合预期，以及 predream / 定时 dreaming 在配置后运转正常。活跃库表规模有达到约千余条句子、十万级 link 行的案例，足以验证召回在非玩具数据量下的表现；你的数据量与延迟会因磁盘、并发与配置而不同。

本机 SSD、中等库容下，单轮落库常见在约 10² ms 量级、召回查询多在百毫秒以内——仅为经验区间，不构成 SLA。网传的「召回准确率百分比」若无复现方法与数据集，宜视为轶事。

一句话：memok 追求可联想、可强化、可维护（含遗忘）的闭环，不依赖单独部署 embedding 服务或第三方向量索引，更接近「结构化笔记图」，而非通用语义检索黑盒。

## 环境要求

- Node.js **≥20**（建议 LTS）
- npm

**OpenClaw 插件：**网关 **≥2026.3.24**、plugin API **≥2026.3.24**（见 [package.json](package.json) 中的 `openclaw.compat`）。

安装依赖：

```bash
npm install
```

### 关于首次安装耗时（请先看）

本仓库 **不声明 `openclaw` 依赖**（网关在运行时提供）。`npm install` 会拉取并构建 **`memok-ai-core`**，其中含 **`better-sqlite3`**，冷缓存下常见 **数分钟**；若长时间停在某个包的 `install`/`postinstall`，多为正常编译。

建议：

- **不要用** `--loglevel verbose` 日常安装。
- 若有 **`.npmrc`**（如 npmmirror），会一并作用于依赖安装；**中国大陆**可优先用 **`install-cn-linux-macos.sh`**（脚本内会设国内 npm 源）。

**无法访问 GitHub 时：** 先克隆 [memok-ai](https://github.com/galaxy8691/memok-ai)（或自建 Gitee 镜像）并在该目录执行 `npm install && npm run build`，再将本仓 `package.json` 中 `memok-ai-core` 改为 `"file:../memok-ai"`（路径按实际调整）后执行 `npm install`。

## 安装方法

### 1）CLI / 文章与 dreaming 管线

请使用 **核心仓** [galaxy8691/memok-ai](https://github.com/galaxy8691/memok-ai)（`memok-ai` CLI、`npm run dev -- …`、单测与 CI）。

### 2）作为 OpenClaw 插件使用

推荐脚本安装：

```bash
# Linux / macOS（脚本从 Gitee 拉取；须指定克隆源为 Gitee，否则脚本内仍默认 GitHub）
export MEMOK_REPO_URL="https://gitee.com/wik20/memok-ai-openclaw.git"
bash <(curl -fsSL https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/install-linux-macos.sh)
```

中国大陆网络推荐（默认 Gitee 源码 + npmmirror；可用环境变量改回 GitHub）：

```bash
bash <(curl -fsSL https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/install-cn-linux-macos.sh)
```

```powershell
# Windows PowerShell（与 GitHub 版脚本相同；指定从 Gitee 克隆源码）
$env:MEMOK_REPO_URL = "https://gitee.com/wik20/memok-ai-openclaw.git"
irm https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/install-windows.ps1 | iex
```

```cmd
:: Windows CMD（先下载再运行；再设环境变量后执行）
curl -L -o install-windows.cmd https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/install-windows.cmd
set MEMOK_REPO_URL=https://gitee.com/wik20/memok-ai-openclaw.git
install-windows.cmd
```

脚本行为：

- 自动执行 `npm install` + `npm run build`
- 通过 `openclaw plugins install` 自动安装插件
- 运行 `openclaw memok setup`；成功后尝试执行 `openclaw gateway restart`（失败时回退为 `openclaw restart`）以使配置生效
- 安装成功后自动删除源码目录（`~/.openclaw/extensions/memok-ai-src`）

常用安装脚本环境变量：

- `MEMOK_PLUGINS_INSTALL_TIMEOUT_SECONDS`（可选；为 `openclaw plugins install` 设置超时秒数，`0` 表示不限制）
- `MEMOK_PLUGINS_INSTALL_NO_PTY=1`（Linux：跳过基于 `script` 的伪终端包装；默认包装异常时使用）
- `MEMOK_SKIP_GATEWAY_RESTART=1`（跳过脚本末尾的网关重启步骤）
- `MEMOK_GATEWAY_RESTART_TIMEOUT_SECONDS`（默认 `120`；Bash 在可用时用 `timeout` 包裹网关重启；PowerShell 用 `Start-Process` + `WaitForExit` 实现同等超时上限）
- `MEMOK_KEEP_SOURCE=1`（调试时保留源码目录）
- `MEMOK_REPO_URL_CN`（可选自定义主仓库；**国内安装脚本默认 Gitee**，未设置时为 `https://gitee.com/wik20/memok-ai-openclaw.git`）
- `MEMOK_REPO_URL_FALLBACK`（回退仓库，默认 **GitHub**；国内安装脚本在主源失败时使用）
- `MEMOK_REPO_URL`（**Windows** `install-windows.ps1`：若设置则用于 `git clone`，中文版说明中设为 Gitee）
- `MEMOK_NPM_REGISTRY`（默认 `https://registry.npmmirror.com`；国内安装脚本）

若 `openclaw plugins install` 已显示成功但进程迟迟不退出（安装脚本停在下一行提示之前），多为 OpenClaw CLI 未结束。**Linux** 上 Bash 脚本可在 `script` 伪终端下运行该命令（可用 `MEMOK_PLUGINS_INSTALL_NO_PTY=1` 关闭）；**Windows PowerShell** 脚本为直接调用，无 PTY 包装。也可 `Ctrl+C` 后若插件文件已就绪，直接执行 `openclaw memok setup`。避免同一插件注册两次（例如同时配置 `memok-ai` 与 `memok-ai-src` 路径）——在 `openclaw.json` 中删除重复项可消除「duplicate plugin id」警告。

如果 setup 报错 `plugins.allow excludes "memok"`，请在 `~/.openclaw/openclaw.json` 的 `plugins.allow` 增加 `"memok"`，然后重试：

```bash
openclaw memok setup
```

手动安装备用方案：

```bash
git clone https://gitee.com/wik20/memok-ai-openclaw.git
cd memok-ai-openclaw
npm install
npm run build
openclaw plugins install .
openclaw memok setup
```

（需要 GitHub 上游时：`git clone https://github.com/galaxy8691/memok-ai-openclaw.git`。）

向导可配置：

- LLM 供应商 / API Key / 模型预设（可手填覆盖）
- `plugins.slots.memory` 固定为 `memok-ai`（向导不再询问是否独占）
- dreaming 定时（dailyAt / cron / timezone）

若在安装脚本之外修改插件或配置，请自行重启网关以便运行中的进程加载新配置（例如 `openclaw gateway restart`）。

## 命令行 / 管线 / 一键 Dreaming

见 **核心仓** [README.zh-CN](https://github.com/galaxy8691/memok-ai/blob/main/README.zh-CN.md) 与 [README](https://github.com/galaxy8691/memok-ai/blob/main/README.md)（`memok-ai` CLI）。

## Dreaming（插件侧）

插件定时 dreaming 开启后，每次执行结果会写入 SQLite 的 `dream_logs` 表，字段包括：

- `dream_date`
- `ts`
- `status`（`ok` / `error`）
- `log_json`（完整 JSON 结果）

## 配置优先级说明（重要）

对 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`MEMOK_LLM_MODEL`：

1. 进程已有环境变量优先
2. 插件配置仅补齐缺失值，不覆盖已有值
3. `.env` 主要用于 **核心仓** [memok-ai](https://github.com/galaxy8691/memok-ai) 的 CLI 本地开发

因此纯插件用户可直接用 `openclaw memok setup`，不强制要求本地 `.env`。

## 贡献指南

欢迎提交贡献。详细规范请见：[CONTRIBUTING.md](./CONTRIBUTING.md)。

## 许可证

本项目采用 [MIT 许可证](LICENSE)。
