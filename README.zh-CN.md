# Memok AI — OpenClaw 插件

[English](./README.md) | 简体中文 · 官网：[memok-ai.com](https://www.memok-ai.com/) · 插件镜像：[Gitee](https://gitee.com/wik20/memok-ai-openclaw)

本仓库是 **Memok 的 OpenClaw 网关插件**。npm 包名仍为 **`memok-ai`**（安装目录多为 `~/.openclaw/extensions/memok-ai/`）。**完整记忆引擎**（流水线、SQLite、dreaming、**`memok-ai` CLI**）在 [核心仓](https://github.com/galaxy8691/memok-ai)；双仓说明见下文「核心与插件」。

**中文文档仅以 Gitee 本仓为准：** [https://gitee.com/wik20/memok-ai-openclaw](https://gitee.com/wik20/memok-ai-openclaw) — 下文一键安装、raw 脚本与克隆地址均使用 **Gitee**；若需 GitHub 默认流程请阅 [英文 README](./README.md)。

## 环境要求

- Node.js **≥20**（建议 LTS）、**npm**
- OpenClaw 网关 **≥2026.3.24**（见 [package.json](package.json) 中 `openclaw.compat`）

## 安装（OpenClaw 插件）

**一键安装：** 在终端里整段粘贴执行即可。命令里的 **`curl -fsSL`** 从 **Gitee raw** 拉取安装脚本，**`bash <(...)`** 直接交给 bash 运行（进程替换，不必先保存再 `chmod`）。机器上需已安装并能在终端里找到 **`git`**、**`node`**、**`npm`**、**`openclaw`**。

脚本 raw 前缀统一为：**`https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/`**（与仓库 [https://gitee.com/wik20/memok-ai-openclaw](https://gitee.com/wik20/memok-ai-openclaw) 同源）。

### Linux / macOS（Gitee 插件 + Gitee 核心 + npmmirror）

对应仓库脚本：[**`scripts/install-cn-linux-macos.sh`**](scripts/install-cn-linux-macos.sh)（优先从 Gitee 克隆插件，并在 **`npm install` 前** 把 **`memok-ai-core`** 指到 Gitee。）

```bash
bash <(curl -fsSL https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/install-cn-linux-macos.sh)
```

若已克隆本仓库，在仓库根目录等价执行：

```bash
bash scripts/install-cn-linux-macos.sh
```

### Windows

对应仓库脚本：[**`scripts/install-windows.ps1`**](scripts/install-windows.ps1)（**`irm`** 下载脚本，**`| iex`** 执行。从 Gitee 克隆插件时安装逻辑会把核心改为 Gitee。）

```powershell
$env:MEMOK_REPO_URL = "https://gitee.com/wik20/memok-ai-openclaw.git"
irm https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/install-windows.ps1 | iex
```

**脚本大致步骤：** `npm install` → `npm run build` → `openclaw plugins install` → `openclaw memok setup` → 尝试重启网关 → 默认删除 `~/.openclaw/extensions/memok-ai-src`（**`MEMOK_KEEP_SOURCE=1`** 则保留）。

**常用环境变量：** `MEMOK_PLUGINS_INSTALL_TIMEOUT_SECONDS`、`MEMOK_PLUGINS_INSTALL_NO_PTY=1`、`MEMOK_SKIP_GATEWAY_RESTART=1`、`MEMOK_GATEWAY_RESTART_TIMEOUT_SECONDS`、`MEMOK_KEEP_SOURCE=1`、`MEMOK_REPO_URL` / `MEMOK_REPO_URL_CN` / `MEMOK_REPO_URL_FALLBACK`、`MEMOK_CORE_GIT_URL`、`MEMOK_CORE_GIT_REF`、`MEMOK_NPM_REGISTRY`（国内脚本默认 npmmirror）——细节见各脚本内注释。

若 setup 提示 `plugins.allow excludes "memok"`，在 `~/.openclaw/openclaw.json` 的 `plugins.allow` 中加入 `"memok"` 后重试 `openclaw memok setup`。

## 手动安装（不用 curl 一键脚本）

从 Gitee 克隆本仓；`package.json` 仍默认从 GitHub 拉核心，故 **`npm install` 前** 先把核心指到 Gitee：

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

|                  | 仓库                                                                                                                                      | 职责                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **核心**         | [galaxy8691/memok-ai](https://github.com/galaxy8691/memok-ai) · [Gitee 镜像](https://gitee.com/wik20/memok-ai)                            | 管线、CLI、单测；作为依赖 **`memok-ai-core`**，插件通过 **`memok-ai-core/openclaw-bridge`** 调用。 |
| **插件（本仓）** | **[Gitee 主站](https://gitee.com/wik20/memok-ai-openclaw)** · [GitHub 镜像](https://github.com/galaxy8691/memok-ai-openclaw) | 仅 `src/plugin.ts`、`openclaw.plugin.json`、`skills/` 等胶水层。                                   |

**`package.json` 只有一份、不分国内/国际版：** `memok-ai-core` 默认 **`git+https://github.com/galaxy8691/memok-ai.git#v1.1.0`**（对应 tag **`v1.1.0`**，GitHub 与 Gitee 核心仓需保持同名 tag）。首次 **`npm install`** 会执行核心包的 **`prepare`** → `npm run build`（含 **`better-sqlite3`** 原生编译，冷缓存常见 **数分钟**）。

**境内从 Gitee 拉核心又不想改仓库 JSON：** 使用 **`install-cn-linux-macos.sh`**；**Windows** 若克隆地址含 **`gitee.com`**（如 **`MEMOK_REPO_URL`** 指向 Gitee），安装脚本会同样改写核心；否则在 **`npm install` 前** 设置 **`MEMOK_CORE_GIT_URL`**=`https://gitee.com/wik20/memok-ai.git`（可选 **`MEMOK_CORE_GIT_REF`**=`v1.1.0`）。

## 本地开发（克隆本仓）

```bash
git clone https://gitee.com/wik20/memok-ai-openclaw.git
cd memok-ai-openclaw
npm pkg set dependencies.memok-ai-core=git+https://gitee.com/wik20/memok-ai.git#v1.1.0
npm install
npm run build
npm run ci    # lint + build + test
```

## 本插件做什么

- 对话落库、按轮召回、`memok_recall_candidate_memories` / `memok_report_used_memory_ids`、可选发梦定时任务
- `openclaw memok setup` 向导与配置写入

**效果验证（经测试）：** 召回 + 上报流程下，候选记忆在回复中被实际用到的比例**超过 95%**（自测场景）；实际因模型与配置而异。

### 与「纯向量库」的差异

|          | memok            | 常见托管向量库 |
| -------- | ---------------- | -------------- |
| 部署     | 本机 SQLite      | 云端 API       |
| 召回     | 词图、权重、抽样 | 向量相似度     |
| 可解释性 | 可查表           | 多为分数       |

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
