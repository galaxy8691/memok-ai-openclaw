# Memok AI — OpenClaw 插件

**为 OpenClaw 网关提供可长期积累的记忆 — 本地 SQLite、上下文召回、可选 LLM 管线。**

本仓库是连接网关与 **[memok-ai](https://www.npmjs.com/package/memok-ai)** 的 **OpenClaw 扩展**（npm 包名 **`memok-ai-openclaw`**）。管线、CLI、表结构等在 **memok-ai** 核心仓；本仓负责胶水层：`src/plugin.ts`、`openclaw.plugin.json` 与内置 **skills**。

[![CI](https://github.com/galaxy8691/memok-ai-openclaw/actions/workflows/ci.yml/badge.svg)](https://github.com/galaxy8691/memok-ai-openclaw/actions/workflows/ci.yml)
[![GitHub stars](https://img.shields.io/github/stars/galaxy8691/memok-ai-openclaw?style=flat)](https://github.com/galaxy8691/memok-ai-openclaw/stargazers)

[官网](https://www.memok-ai.com/) · [npm 上的 memok-ai](https://www.npmjs.com/package/memok-ai) · **[Gitee 本仓](https://gitee.com/wik20/memok-ai-openclaw)** · [参与贡献](CONTRIBUTING.md) · [更新日志](CHANGELOG.md)

**[English](./README.md) | 简体中文**

**国内用户：** 一键安装、raw 脚本与 Gitee 克隆见下文 **「快速安装」**；与 [英文 README](./README.md) 章节结构一致，默认境外流程以英文版为准。

---

## 这是什么？

执行 **`openclaw plugins install`** 后，网关加载本包并注册 **memory** 类插件：可把对话**落库**到 **SQLite**、每轮**召回**候选记忆（skill / 工具 / prepend 等模式），并可按需启用网关内**定时「发梦」**管线（调用你配置的 LLM），底层均由 **`memok-ai`** 驱动。

**磁盘上的安装路径：** 网关使用 **`openclaw.plugin.json` → `id`**（当前 **`memok-ai`**），**不是** `package.json` 的 **`name`**，因此目录为 **`~/.openclaw/extensions/memok-ai/`**。核心管线配置写入 **`~/.openclaw/extensions/memok-ai/config.toml`**（通过 **`openclaw memok setup`**）。

---

## 功能特性

- **落库 + 召回** — 持久化 transcript、召回标记；工具 `memok_recall_candidate_memories` / `memok_report_used_memory_ids`；可配置 `memoryRecallMode`（`skill`、`skill+hint`、`prepend`）。
- **本地优先** — SQLite 随网关部署；默认路径不依赖托管向量 API。
- **向导 + UI 配置** — **`openclaw memok setup`** 与网关 UI 提示（LLM、密钥、发梦时间等）。
- **可选发梦定时任务** — 网关侧每日时间或 cron；predream / story 等阶段；结果写入 SQLite 表 **`dream_logs`**。
- **内置 Skill** — `skills/memok-memory` 说明模型如何配合记忆工具使用。

---

## 快速安装

需要 **Node.js ≥ 20**、**npm**、**git**，且终端能找到 **`openclaw`**。网关需 **OpenClaw ≥ 2026.3.24**（见 [package.json](package.json) 中 `openclaw.compat`）。

### Linux / macOS — 默认（npm 安装核心）

从默认 registry 安装 **`memok-ai`**（`package.json` 中为 **`"memok-ai": "^0.2.3"`**；插件从 **`memok-ai/bridge`** 引用）。

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/galaxy8691/memok-ai-openclaw/main/scripts/install-linux-macos.sh)
```

### Linux / macOS — 国内（Gitee 克隆插件 + npmmirror）

[`scripts/install-cn-linux-macos.sh`](scripts/install-cn-linux-macos.sh) 优先从 **Gitee** 克隆**插件**，**`npm install`** 默认走 **npmmirror**。若核心必须从 Git 安装，设置 **`MEMOK_CORE_GIT_URL`**（可选 **`MEMOK_CORE_GIT_REF`**）。

```bash
bash <(curl -fsSL https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/install-cn-linux-macos.sh)
```

已克隆本仓库时，在仓库根目录可执行：`bash scripts/install-cn-linux-macos.sh`。

若访问 **`registry.npmjs.org`** 较慢，请用本段脚本，或在默认脚本前设置 **`MEMOK_NPM_REGISTRY`**。

### Windows（PowerShell）

**默认（GitHub raw；核心来自 npm）：**

```powershell
irm https://raw.githubusercontent.com/galaxy8691/memok-ai-openclaw/main/scripts/install-windows.ps1 | iex
```

**从 Gitee 克隆插件**（克隆 URL 为 Gitee 时，安装器对 **`npm install`** 默认使用 npmmirror）：

```powershell
$env:MEMOK_REPO_URL = "https://gitee.com/wik20/memok-ai-openclaw.git"
irm https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/install-windows.ps1 | iex
```

**安装器大致步骤：** `npm install` → `npm run build` → `openclaw plugins install` → `openclaw memok setup` → 尝试重启网关 → 默认删除 `~/.openclaw/extensions/memok-ai-openclaw-src`（设置 **`MEMOK_KEEP_SOURCE=1`** 则保留）。

**常用环境变量：** `MEMOK_PLUGINS_INSTALL_TIMEOUT_SECONDS`、`MEMOK_PLUGINS_INSTALL_NO_PTY=1`、`MEMOK_SKIP_GATEWAY_RESTART=1`、`MEMOK_GATEWAY_RESTART_TIMEOUT_SECONDS`、`MEMOK_KEEP_SOURCE=1`、`MEMOK_REPO_URL` / `MEMOK_REPO_URL_CN` / `MEMOK_REPO_URL_FALLBACK`、`MEMOK_CORE_GIT_URL`、`MEMOK_CORE_GIT_REF`、`MEMOK_NPM_REGISTRY` — 详见各脚本文件头注释。

若提示 `plugins.allow` 拦截，在 `~/.openclaw/openclaw.json` 的 `plugins.allow` 中加入 **`"memok"`** 后重新执行 **`openclaw memok setup`**。

---

## 上手步骤

### 1. 安装插件

使用上文 **快速安装**，或从克隆目录安装：

**GitHub：**

```bash
git clone https://github.com/galaxy8691/memok-ai-openclaw.git
cd memok-ai-openclaw
npm install && npm run build
openclaw plugins install .
```

**Gitee + npmmirror：**

```bash
git clone https://gitee.com/wik20/memok-ai-openclaw.git
cd memok-ai-openclaw
npm install --registry https://registry.npmmirror.com && npm run build
openclaw plugins install .
```

若 **npm 无法安装 `memok-ai`**，在 **`npm install` 前**执行：  
`npm pkg set dependencies.memok-ai=git+https://gitee.com/wik20/memok-ai.git#v0.1.0`  
**完全离线：** 本地构建核心后，将 `package.json` 中 **`memok-ai`** 改为 `"file:/你的路径/memok-ai"` 再 `npm install`。

### 2. 运行 Memok 配置向导

```bash
openclaw memok setup
```

会写入 **`~/.openclaw/extensions/memok-ai/config.toml`**（`MemokPipelineConfig`）并同步网关侧相关项。若启动时该文件缺失，插件会打错误日志并跳过注册，需重新执行 setup。

### 3. 按提示重启网关（如有）

便于扩展与 skills 被干净加载。

### 4. 在新会话中使用记忆

新开 OpenClaw 会话。召回行为取决于插件配置中的 **`memoryRecallMode`**（见 `openclaw.plugin.json` / 网关 UI）。在「召回 + 上报」流程下，我们自测中候选记忆被有效利用的比例**超过 95%**；实际效果因模型与配置而异。

---

## 核心与插件

| | 仓库 | 职责 |
|---|------|------|
| **核心** | [galaxy8691/memok-ai](https://github.com/galaxy8691/memok-ai) · [Gitee 镜像](https://gitee.com/wik20/memok-ai) | 管线、CLI、测试；npm **`memok-ai`**，代码 **`memok-ai/bridge`**。 |
| **插件（本仓）** | **[Gitee 主站](https://gitee.com/wik20/memok-ai-openclaw)** · [GitHub 镜像](https://github.com/galaxy8691/memok-ai-openclaw) | OpenClaw 注册、TOML 向导、transcript 钩子、skills。 |

首次 **`npm install`** 会执行 **`memok-ai`** 的 **`prepare`** → **`npm run build`**（含 **`better-sqlite3`** 原生编译，冷缓存下常见 **数分钟**）。

---

## Memok 与常见托管向量库

| | Memok（本栈） | 常见托管向量库 |
|---|--------------|----------------|
| **部署** | 本机 SQLite | 云端 API + 计费 |
| **召回** | 词图、权重、抽样 | 向量相似度 |
| **可解释性** | 可查表 | 多为分数 |

### 重度使用反馈（非基准）

跨会话跟进、引用记忆时的上报与权重、predream / 定时 dreaming 在配置正确时表现稳定；千余句、十万级 link 的库并不罕见。延迟与数据量、磁盘有关。

---

## 架构

```
┌─────────────────────┐      ┌──────────────────────────┐      ┌─────────────┐
│  OpenClaw 网关       │─────>│  memok-ai-openclaw       │─────>│  memok-ai   │
│  （插件宿主）        │      │  （本插件 / skills）      │      │  （npm 核心） │
└─────────────────────┘      └────────────┬─────────────┘      └──────┬──────┘
                                            │                            │
                                            └────────────────────────────>│
                                                                 ┌───────▼───────┐
                                                                 │ SQLite 数据库  │
                                                                 │ (memok.sqlite) │
                                                                 └───────────────┘
```

| 层级 | 技术栈 |
|------|--------|
| 网关 | OpenClaw **≥ 2026.3.24** |
| 扩展 | TypeScript → **`dist/plugin.js`**、`openclaw.plugin.json`、`skills/` |
| 记忆引擎 | **`memok-ai`**（`memok-ai/bridge`）、SQLite、可选 LLM 调用 |

---

## 常用 OpenClaw 命令

| 命令 | 作用 |
|------|------|
| `openclaw plugins install .` | 从已克隆的插件目录安装 |
| `openclaw memok setup` | 向导：库路径、LLM、`config.toml`、网关侧提示 |

管线命令、Dreaming 一键与核心 CLI 见 **[memok-ai README.zh-CN](https://github.com/galaxy8691/memok-ai/blob/main/README.zh-CN.md)** / [README](https://github.com/galaxy8691/memok-ai/blob/main/README.md)。

---

## 配置优先级（`OPENAI_*`、`MEMOK_LLM_MODEL`）

1. **已存在的环境变量**优先。  
2. **插件 / 向导**只补缺。  
3. **本插件**的 LLM 与 SQLite 管线参数来自 **`~/.openclaw/extensions/memok-ai/config.toml`**（发梦 cron、召回 UI 等仍在 **`openclaw.json`**，以网关文档为准）。

一般用户只需 **`openclaw memok setup`**。

---

## Dreaming（插件侧定时）

每次定时运行会写入 SQLite 表 **`dream_logs`**：`dream_date`、`ts`、`status`（`ok` / `error`）、`log_json`。

---

## 本地开发

**前置：** Node.js **≥ 20**、npm。

```bash
git clone https://gitee.com/wik20/memok-ai-openclaw.git
cd memok-ai-openclaw
npm install --registry https://registry.npmmirror.com
npm run build
npm run ci    # lint + build + test
```

亦可从 GitHub 克隆后使用默认 `npm install`。若无法从 npm 拉取 **`memok-ai`**，在 **`npm install` 前**：

```bash
npm pkg set dependencies.memok-ai=git+https://gitee.com/wik20/memok-ai.git#v0.1.0
npm install
```

扩展仓职责与升级 **`memok-ai`** 的注意点见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 贡献指南

见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 许可证

[MIT 许可证](LICENSE)。
