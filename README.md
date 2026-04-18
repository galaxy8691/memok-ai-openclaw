# Memok AI — OpenClaw plugin

English | [简体中文](./README.zh-CN.md) · Website: [memok-ai.com](https://www.memok-ai.com/) · Plugin mirror: [Gitee](https://gitee.com/wik20/memok-ai-openclaw)

This repository is the **OpenClaw gateway extension** for Memok memory. The npm package is still named **`memok-ai`** (OpenClaw path `~/.openclaw/extensions/memok-ai/`). The **full memory engine** (pipeline, SQLite, dreaming, **`memok-ai` CLI**) lives in the [core repo](https://github.com/galaxy8691/memok-ai); details below after install.

## Requirements

- Node.js **≥20** (LTS recommended), **npm**
- OpenClaw gateway **≥2026.3.24** (see `openclaw.compat` in [package.json](package.json))

## Install (OpenClaw plugin)

Recommended: run an installer from **`scripts/`** (Linux and macOS share one Bash script each; Windows uses PowerShell).

### Linux and macOS

| Script in repo | Use when | One-liner |
| --- | --- | --- |
| **[`scripts/install-linux-macos.sh`](scripts/install-linux-macos.sh)** | Default: GitHub-friendly network; **`memok-ai-core`** from GitHub per `package.json` | `bash <(curl -fsSL https://raw.githubusercontent.com/galaxy8691/memok-ai-openclaw/main/scripts/install-linux-macos.sh)` |
| **[`scripts/install-cn-linux-macos.sh`](scripts/install-cn-linux-macos.sh)** | Mainland China: Gitee-first clone, **`npm pkg set`** core to Gitee before `npm install`, default npmmirror | `bash <(curl -fsSL https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/install-cn-linux-macos.sh)` |

**Do not** clone the **plugin** only from Gitee and run **`install-linux-macos.sh`** without patching core: that script still resolves **`memok-ai-core`** from **GitHub** unless you set **`MEMOK_CORE_GIT_URL`**. Prefer **`install-cn-linux-macos.sh`**, or export **`MEMOK_CORE_GIT_URL`**=`https://gitee.com/wik20/memok-ai.git` (optional **`MEMOK_CORE_GIT_REF`**=`v1.1.0`) before **`install-linux-macos.sh`**.

If you already cloned this repo locally, from the repo root:

```bash
bash scripts/install-linux-macos.sh          # default / GitHub core
# or
bash scripts/install-cn-linux-macos.sh       # China / Gitee core + mirror
```

### Windows

Script: **[`scripts/install-windows.ps1`](scripts/install-windows.ps1)**.

GitHub clone (default core):

```powershell
irm https://raw.githubusercontent.com/galaxy8691/memok-ai-openclaw/main/scripts/install-windows.ps1 | iex
```

Gitee clone URL + automatic Gitee core:

```powershell
$env:MEMOK_REPO_URL = "https://gitee.com/wik20/memok-ai-openclaw.git"
irm https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/install-windows.ps1 | iex
```

**What the installers do:** `npm install` → `npm run build` → `openclaw plugins install` → `openclaw memok setup` → optional gateway restart → remove `~/.openclaw/extensions/memok-ai-src` unless **`MEMOK_KEEP_SOURCE=1`**.

**Useful env vars:** `MEMOK_PLUGINS_INSTALL_TIMEOUT_SECONDS`, `MEMOK_PLUGINS_INSTALL_NO_PTY=1`, `MEMOK_SKIP_GATEWAY_RESTART=1`, `MEMOK_GATEWAY_RESTART_TIMEOUT_SECONDS`, `MEMOK_KEEP_SOURCE=1`, `MEMOK_REPO_URL` / `MEMOK_REPO_URL_CN` / `MEMOK_REPO_URL_FALLBACK`, `MEMOK_CORE_GIT_URL`, `MEMOK_CORE_GIT_REF`, `MEMOK_NPM_REGISTRY` (cn script defaults to npmmirror) — see script headers and [README.zh-CN.md](./README.zh-CN.md) for Chinese details.

If `plugins.allow` blocks memok, add `"memok"` under `plugins.allow` in `~/.openclaw/openclaw.json`, then run `openclaw memok setup` again.

## Manual install (no curl script)

**From GitHub:**

```bash
git clone https://github.com/galaxy8691/memok-ai-openclaw.git
cd memok-ai-openclaw
npm install && npm run build
openclaw plugins install .
openclaw memok setup
```

**From Gitee** (patch core **before** `npm install` if GitHub is unreachable):

```bash
git clone https://gitee.com/wik20/memok-ai-openclaw.git
cd memok-ai-openclaw
npm pkg set dependencies.memok-ai-core=git+https://gitee.com/wik20/memok-ai.git#v1.1.0
npm install && npm run build
openclaw plugins install .
openclaw memok setup
```

**Air-gapped:** build core locally, then set `"memok-ai-core": "file:/path/to/memok-ai"` in `package.json` and `npm install`.

## Core vs plugin (repos)

| | Repository | Role |
| --- | --- | --- |
| **Core** | [galaxy8691/memok-ai](https://github.com/galaxy8691/memok-ai) · [Gitee mirror](https://gitee.com/wik20/memok-ai) | Pipelines, CLI, tests; dependency **`memok-ai-core`**, import **`memok-ai-core/openclaw-bridge`**. |
| **Plugin (this repo)** | [galaxy8691/memok-ai-openclaw](https://github.com/galaxy8691/memok-ai-openclaw) · [Gitee mirror](https://gitee.com/wik20/memok-ai-openclaw) | `src/plugin.ts`, `openclaw.plugin.json`, `skills/` only. |

**Single `package.json`:** `memok-ai-core` defaults to **`git+https://github.com/galaxy8691/memok-ai.git#v1.1.0`** (tag **`v1.1.0`** on that host). First `npm install` runs the core package’s **`prepare`** → `npm run build` (includes native **`better-sqlite3`**, often **minutes** on a cold cache).

**China / Gitee core without editing the repo:** use **`install-cn-linux-macos.sh`**, or on Windows set clone URL to Gitee (`MEMOK_REPO_URL`), or set **`MEMOK_CORE_GIT_URL`** before `npm install`.

## Development (clone this repo)

```bash
git clone https://github.com/galaxy8691/memok-ai-openclaw.git
cd memok-ai-openclaw
npm install   # resolves memok-ai-core from GitHub per package.json
npm run build
npm run ci    # lint + build + tests
```

If you **only** have access to **Gitee** for the core library, **before** `npm install`:

```bash
npm pkg set dependencies.memok-ai-core=git+https://gitee.com/wik20/memok-ai.git#v1.1.0
npm install
```

## What the plugin does

- Persists transcripts, per-turn recall (`before_prompt_build`), tools `memok_recall_candidate_memories` / `memok_report_used_memory_ids`, optional dreaming cron
- `openclaw memok setup` wizard and plugin config

**Evaluation (tested):** with recall + report flow, effective use of candidate memories **exceeded 95%** in our runs; your mileage varies by model and settings.

### Compared to embedding-only stacks

| | Memok | Typical hosted vector DB |
| --- | --- | --- |
| Deployment | Local SQLite | Cloud API + billing |
| Recall | Word graph, weights, sampling | Embedding similarity |
| Explainability | Inspectable rows | Mostly scores |

### Notes from real use

Users report coherent multi-session follow-up and stable feedback when citing memories; DBs with ~1k sentences / 100k+ link rows are not uncommon. Timing is workload-dependent (~10² ms class for persist in informal local tests), not a SLA.

## CLI / pipelines / dreaming one-shots

Use the **core** repo: [README](https://github.com/galaxy8691/memok-ai/blob/main/README.md) · [README.zh-CN](https://github.com/galaxy8691/memok-ai/blob/main/README.zh-CN.md).

## Dreaming (plugin cron)

When dreaming cron runs, each run is stored in SQLite **`dream_logs`**: `dream_date`, `ts`, `status` (`ok` / `error`), `log_json`.

## Config priority (`OPENAI_*`, `MEMOK_LLM_MODEL`)

1. Existing environment variables win  
2. Plugin config fills gaps only  
3. `.env` is for **core** CLI dev in [memok-ai](https://github.com/galaxy8691/memok-ai)  

Plugin users normally rely on `openclaw memok setup` only.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT License](LICENSE).
