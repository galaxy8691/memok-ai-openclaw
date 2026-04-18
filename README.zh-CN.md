# Memok AI — OpenClaw 插件

[English](./README.md) | 简体中文 · 官网：[memok-ai.com](https://www.memok-ai.com/) · 插件镜像：[Gitee](https://gitee.com/wik20/memok-ai-openclaw)

本仓库是 **Memok 的 OpenClaw 网关插件**。npm 包名仍为 **`memok-ai`**（安装目录多为 `~/.openclaw/extensions/memok-ai/`）。**完整记忆引擎**（流水线、SQLite、dreaming、**`memok-ai` CLI**）在 [核心仓](https://github.com/galaxy8691/memok-ai)；双仓说明见下文「核心与插件」。

**Gitee 本仓：** [gitee.com/wik20/memok-ai-openclaw](https://gitee.com/wik20/memok-ai-openclaw) 可作境内展示与 raw 脚本入口；网页端可将默认 README 设为本文。

## 环境要求

- Node.js **≥20**（建议 LTS）、**npm**
- OpenClaw 网关 **≥2026.3.24**（见 [package.json](package.json) 中 `openclaw.compat`）

## 安装（OpenClaw 插件）

推荐：使用本仓库 **`scripts/`** 下的安装脚本（**Linux 与 macOS 各对应一个 Bash 脚本**，共用逻辑；Windows 为 PowerShell）。

### Linux 与 macOS

| 仓库内脚本 | 适用场景 | 一键命令 |
| --- | --- | --- |
| **[`scripts/install-linux-macos.sh`](scripts/install-linux-macos.sh)** | 默认：网络便于访问 GitHub；**`memok-ai-core`** 按 `package.json` 从 **GitHub** 拉取 | `bash <(curl -fsSL https://raw.githubusercontent.com/galaxy8691/memok-ai-openclaw/main/scripts/install-linux-macos.sh)` |
| **[`scripts/install-cn-linux-macos.sh`](scripts/install-cn-linux-macos.sh)** | 中国大陆：优先从 **Gitee** 克隆插件、在 **`npm install` 前** 把核心改为 **Gitee**，默认 **npmmirror**  registry | `bash <(curl -fsSL https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/install-cn-linux-macos.sh)` |

> **不要**只用 **Gitee** 拉**插件**源码却跑「国际版」**`install-linux-macos.sh`** 且不改核心：该脚本默认仍从 **GitHub** 装 **`memok-ai-core`**。境内请用 **`install-cn-linux-macos.sh`**，或在运行前设置 **`MEMOK_CORE_GIT_URL`**=`https://gitee.com/wik20/memok-ai.git`（可选 **`MEMOK_CORE_GIT_REF`**=`v1.1.0`）。

若已克隆本仓库到本地，在仓库根目录执行：

```bash
bash scripts/install-linux-macos.sh          # 默认 / GitHub 核心
# 或
bash scripts/install-cn-linux-macos.sh       # 境内 / Gitee 核心 + 镜像
```

### Windows

脚本：**[`scripts/install-windows.ps1`](scripts/install-windows.ps1)**。

**从 GitHub 拉安装脚本（默认核心）：**

```powershell
irm https://raw.githubusercontent.com/galaxy8691/memok-ai-openclaw/main/scripts/install-windows.ps1 | iex
```

**指定 Gitee 克隆插件 URL（并自动改 Gitee 核心）：**

```powershell
$env:MEMOK_REPO_URL = "https://gitee.com/wik20/memok-ai-openclaw.git"
irm https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/install-windows.ps1 | iex
```

**脚本大致步骤：** `npm install` → `npm run build` → `openclaw plugins install` → `openclaw memok setup` → 尝试重启网关 → 默认删除 `~/.openclaw/extensions/memok-ai-src`（**`MEMOK_KEEP_SOURCE=1`** 则保留）。

**常用环境变量：** `MEMOK_PLUGINS_INSTALL_TIMEOUT_SECONDS`、`MEMOK_PLUGINS_INSTALL_NO_PTY=1`、`MEMOK_SKIP_GATEWAY_RESTART=1`、`MEMOK_GATEWAY_RESTART_TIMEOUT_SECONDS`、`MEMOK_KEEP_SOURCE=1`、`MEMOK_REPO_URL` / `MEMOK_REPO_URL_CN` / `MEMOK_REPO_URL_FALLBACK`、`MEMOK_CORE_GIT_URL`、`MEMOK_CORE_GIT_REF`、`MEMOK_NPM_REGISTRY`（国内脚本默认 npmmirror）——细节见各脚本内注释。

若 setup 提示 `plugins.allow excludes "memok"`，在 `~/.openclaw/openclaw.json` 的 `plugins.allow` 中加入 `"memok"` 后重试 `openclaw memok setup`。

## 手动安装（不用 curl 一键脚本）

**从 GitHub 克隆本仓：**

```bash
git clone https://github.com/galaxy8691/memok-ai-openclaw.git
cd memok-ai-openclaw
npm install && npm run build
openclaw plugins install .
openclaw memok setup
```

**从 Gitee 克隆本仓：** `package.json` 仍默认从 **GitHub** 拉核心；若访问 GitHub 不便，**必须先**改核心依赖再装：

```bash
git clone https://gitee.com/wik20/memok-ai-openclaw.git
cd memok-ai-openclaw
npm pkg set dependencies.memok-ai-core=git+https://gitee.com/wik20/memok-ai.git#v1.1.0
npm install && npm run build
openclaw plugins install .
openclaw memok setup
```

**完全离线：** 本地构建核心仓后，将 `memok-ai-core` 改为 `"file:/你的路径/memok-ai"` 再 `npm install`。

## 核心与插件（双仓）

| | 仓库 | 职责 |
| --- | --- | --- |
| **核心** | [galaxy8691/memok-ai](https://github.com/galaxy8691/memok-ai) · [Gitee 镜像](https://gitee.com/wik20/memok-ai) | 管线、CLI、单测；作为依赖 **`memok-ai-core`**，插件通过 **`memok-ai-core/openclaw-bridge`** 调用。 |
| **插件（本仓）** | [galaxy8691/memok-ai-openclaw](https://github.com/galaxy8691/memok-ai-openclaw) · [Gitee 镜像](https://gitee.com/wik20/memok-ai-openclaw) | 仅 `src/plugin.ts`、`openclaw.plugin.json`、`skills/` 等胶水层。 |

**`package.json` 只有一份、不分国内/国际版：** `memok-ai-core` 默认 **`git+https://github.com/galaxy8691/memok-ai.git#v1.1.0`**（对应 tag **`v1.1.0`**，GitHub 与 Gitee 核心仓需保持同名 tag）。首次 **`npm install`** 会执行核心包的 **`prepare`** → `npm run build`（含 **`better-sqlite3`** 原生编译，冷缓存常见 **数分钟**）。

**境内从 Gitee 拉核心又不想改仓库 JSON：** 使用 **`install-cn-linux-macos.sh`**；**Windows** 若克隆地址含 **`gitee.com`**（如 **`MEMOK_REPO_URL`** 指向 Gitee），安装脚本会同样改写核心；否则在 **`npm install` 前** 设置 **`MEMOK_CORE_GIT_URL`**=`https://gitee.com/wik20/memok-ai.git`（可选 **`MEMOK_CORE_GIT_REF`**=`v1.1.0`）。

## 本地开发（克隆本仓）

```bash
git clone https://github.com/galaxy8691/memok-ai-openclaw.git
cd memok-ai-openclaw
npm install   # 按 package.json 从 GitHub 解析 memok-ai-core
npm run build
npm run ci    # lint + build + test
```

若**只能访问 Gitee 拉核心**，在 **`npm install` 之前**执行：

```bash
npm pkg set dependencies.memok-ai-core=git+https://gitee.com/wik20/memok-ai.git#v1.1.0
npm install
```

## 本插件做什么

- 对话落库、按轮召回、`memok_recall_candidate_memories` / `memok_report_used_memory_ids`、可选发梦定时任务  
- `openclaw memok setup` 向导与配置写入  

**效果验证（经测试）：** 召回 + 上报流程下，候选记忆在回复中被实际用到的比例**超过 95%**（自测场景）；实际因模型与配置而异。

### 与「纯向量库」的差异

| | memok | 常见托管向量库 |
| --- | --- | --- |
| 部署 | 本机 SQLite | 云端 API |
| 召回 | 词图、权重、抽样 | 向量相似度 |
| 可解释性 | 可查表 | 多为分数 |

### 重度使用反馈（非基准）

跨会话跟进、引用记忆时上报与权重行为、predream/定时 dreaming 等在配置正确时表现稳定；千余句、十万级 link 的库并不罕见。延迟与数据量、磁盘有关；网传「准确率」若无复现方法仅供参考。

## 命令行 / 管线 / 一键 Dreaming

见 **核心仓** [README.zh-CN](https://github.com/galaxy8691/memok-ai/blob/main/README.zh-CN.md) 与 [README](https://github.com/galaxy8691/memok-ai/blob/main/README.md)。

## Dreaming（插件侧）

插件定时 dreaming 每次运行会写入 SQLite 表 **`dream_logs`**：`dream_date`、`ts`、`status`（`ok` / `error`）、`log_json`。

## 配置优先级（`OPENAI_*`、`MEMOK_LLM_MODEL`）

1. 进程环境变量优先  
2. 插件配置只补缺  
3. `.env` 主要用于 **核心仓** [memok-ai](https://github.com/galaxy8691/memok-ai) 的 CLI 开发  

纯插件用户一般只需 `openclaw memok setup`。

## 贡献指南

见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 许可证

[MIT 许可证](LICENSE)。
