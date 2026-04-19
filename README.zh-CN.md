# Memok AI — OpenClaw 插件

[English](./README.md) | 简体中文 · 官网：[memok-ai.com](https://www.memok-ai.com/) · 插件镜像：[Gitee](https://gitee.com/wik20/memok-ai-openclaw)

本仓库是 **Memok 的 OpenClaw 网关插件**。本仓库 **npm 包名**为 **`memok-ai-openclaw`**。执行 **`openclaw plugins install`** 后，网关把扩展装在 **`~/.openclaw/extensions/<插件 id>/`**，其中 **`<插件 id>`** 取自 **`openclaw.plugin.json` 的 `id` 字段**（当前为 **`memok-ai`**），**与 `package.json` 的 `name` 无关** — 因此实际目录是 **`~/.openclaw/extensions/memok-ai/`**。**完整记忆引擎**为独立 npm 包 **[`memok-ai`](https://www.npmjs.com/package/memok-ai)**，源码在 [核心仓](https://github.com/galaxy8691/memok-ai)；双仓说明见下文「核心与插件」。

**中文文档仅以 Gitee 本仓为准：** [https://gitee.com/wik20/memok-ai-openclaw](https://gitee.com/wik20/memok-ai-openclaw) — 下文一键安装、raw 脚本与克隆地址均使用 **Gitee**；若需 GitHub 默认流程请阅 [英文 README](./README.md)。

## 环境要求

- Node.js **≥20**（建议 LTS）、**npm**
- OpenClaw 网关 **≥2026.3.24**（见 [package.json](package.json) 中 `openclaw.compat`）

## 安装（OpenClaw 插件）

**一键安装：** 在终端里整段粘贴执行即可。命令里的 **`curl -fsSL`** 从 **Gitee raw** 拉取安装脚本，**`bash <(...)`** 直接交给 bash 运行（进程替换，不必先保存再 `chmod`）。机器上需已安装并能在终端里找到 **`git`**、**`node`**、**`npm`**、**`openclaw`**。

脚本 raw 前缀统一为：**`https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/`**（与仓库 [https://gitee.com/wik20/memok-ai-openclaw](https://gitee.com/wik20/memok-ai-openclaw) 同源）。

### Linux / macOS（Gitee 克隆插件 + npmmirror 装核心）

对应仓库脚本：[**`scripts/install-cn-linux-macos.sh`**](scripts/install-cn-linux-macos.sh)（优先从 Gitee 克隆**插件**；核心 **[npm 包 `memok-ai`](https://www.npmjs.com/package/memok-ai)** 通过 **`npm install --registry`** 默认走 **npmmirror**。若必须从 Git 装核心，设置 **`MEMOK_CORE_GIT_URL`**（可选 **`MEMOK_CORE_GIT_REF`**）。）

```bash
bash <(curl -fsSL https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/install-cn-linux-macos.sh)
```

若已克隆本仓库，在仓库根目录等价执行：

```bash
bash scripts/install-cn-linux-macos.sh
```

### Windows

对应仓库脚本：[**`scripts/install-windows.ps1`**](scripts/install-windows.ps1)（**`irm`** 下载脚本，**`| iex`** 执行。克隆地址为 **Gitee** 时，**`npm install`** 默认使用 **npmmirror** 拉取 npm 上的 **`memok-ai`**。）

```powershell
$env:MEMOK_REPO_URL = "https://gitee.com/wik20/memok-ai-openclaw.git"
irm https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/install-windows.ps1 | iex
```

**脚本大致步骤：** `npm install` → `npm run build` → `openclaw plugins install` → `openclaw memok setup` → 尝试重启网关 → 默认删除 `~/.openclaw/extensions/memok-ai-openclaw-src`（**`MEMOK_KEEP_SOURCE=1`** 则保留）。

**常用环境变量：** `MEMOK_PLUGINS_INSTALL_TIMEOUT_SECONDS`、`MEMOK_PLUGINS_INSTALL_NO_PTY=1`、`MEMOK_SKIP_GATEWAY_RESTART=1`、`MEMOK_GATEWAY_RESTART_TIMEOUT_SECONDS`、`MEMOK_KEEP_SOURCE=1`、`MEMOK_REPO_URL` / `MEMOK_REPO_URL_CN` / `MEMOK_REPO_URL_FALLBACK`、`MEMOK_CORE_GIT_URL`、`MEMOK_CORE_GIT_REF`、`MEMOK_NPM_REGISTRY`（国内脚本默认 npmmirror）——细节见各脚本内注释。

若 setup 提示 `plugins.allow excludes "memok"`，在 `~/.openclaw/openclaw.json` 的 `plugins.allow` 中加入 `"memok"` 后重试 `openclaw memok setup`。

## 手动安装（不用 curl 一键脚本）

从 Gitee 克隆本仓；核心依赖 **`memok-ai@^0.1.0`**，建议用境内 registry 安装：

```bash
git clone https://gitee.com/wik20/memok-ai-openclaw.git
cd memok-ai-openclaw
npm install --registry https://registry.npmmirror.com && npm run build
openclaw plugins install .
openclaw memok setup
```

若 **npm 无法安装 `memok-ai`**，再在 **`npm install` 前** 执行：  
`npm pkg set dependencies.memok-ai=git+https://gitee.com/wik20/memok-ai.git#v0.1.0`

**完全离线：** 本地构建核心仓后，将 **`memok-ai`** 改为 `"file:/你的路径/memok-ai"` 再 `npm install`。

## 核心与插件（双仓）

|                  | 仓库                                                                                                                                      | 职责                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **核心**         | [galaxy8691/memok-ai](https://github.com/galaxy8691/memok-ai) · [Gitee 镜像](https://gitee.com/wik20/memok-ai)                            | 管线、CLI、单测；npm 包 **`memok-ai`**，插件 **`memok-ai/openclaw-bridge`**。 |
| **插件（本仓）** | **[Gitee 主站](https://gitee.com/wik20/memok-ai-openclaw)** · [GitHub 镜像](https://github.com/galaxy8691/memok-ai-openclaw) | 仅 `src/plugin.ts`、`openclaw.plugin.json`、`skills/` 等胶水层。                                   |

**`package.json` 只有一份：** 依赖 **`memok-ai`** 版本 **`^0.1.0`**（[npm 上的 `memok-ai`](https://www.npmjs.com/package/memok-ai)，代码从 **`memok-ai/openclaw-bridge`** 引用）。首次 **`npm install`** 会执行该包的 **`prepare`** → `npm run build`（含 **`better-sqlite3`** 原生编译，冷缓存常见 **数分钟**）。

**境内：** 使用 **`install-cn-linux-macos.sh`** 或 **`npm install --registry https://registry.npmmirror.com`**。**必须用 Git 装核心时** 设置 **`MEMOK_CORE_GIT_URL`**（可选 **`MEMOK_CORE_GIT_REF`**）后再 **`npm install`**。

## 本地开发（克隆本仓）

```bash
git clone https://gitee.com/wik20/memok-ai-openclaw.git
cd memok-ai-openclaw
npm install --registry https://registry.npmmirror.com
npm run build
npm run ci    # lint + build + test
```

若无法从 npm 拉取 **`memok-ai`**，在 **`npm install` 前**：  
`npm pkg set dependencies.memok-ai=git+https://gitee.com/wik20/memok-ai.git#v0.1.0`

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
