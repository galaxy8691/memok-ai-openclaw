# Memok AI — OpenClaw plugin

**Long-lived memory for your OpenClaw gateway — local SQLite, recall into context, optional LLM pipelines.**

This repo is the **OpenClaw extension** (`npm` **`memok-ai-openclaw`**) that connects the gateway to the **[memok-ai](https://www.npmjs.com/package/memok-ai)** engine. The heavy lifting (pipelines, CLI, schema) lives in **memok-ai**; this tree is glue: `src/plugin.ts`, `openclaw.plugin.json`, and bundled **skills**.

[![CI](https://github.com/galaxy8691/memok-ai-openclaw/actions/workflows/ci.yml/badge.svg)](https://github.com/galaxy8691/memok-ai-openclaw/actions/workflows/ci.yml)
[![GitHub stars](https://img.shields.io/github/stars/galaxy8691/memok-ai-openclaw?style=flat)](https://github.com/galaxy8691/memok-ai-openclaw/stargazers)

[Website](https://www.memok-ai.com/) · [`memok-ai` on npm](https://www.npmjs.com/package/memok-ai) · [Gitee mirror](https://gitee.com/wik20/memok-ai-openclaw) · [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

**English | [简体中文](README.zh-CN.md)**

---

## What is this?

After **`openclaw plugins install`**, OpenClaw loads this package and registers a **memory** plugin. It can **persist** conversation transcripts to **SQLite**, **recall** candidate memories each turn (skills / tools / prepend modes), and optionally run **scheduled “dreaming”** pipelines that call your configured LLM — all driven by **`memok-ai`** under the hood.

**Install path on disk:** OpenClaw uses **`openclaw.plugin.json` → `id`** (currently **`memok-ai`**), not `package.json` **`name`**, so the live folder is **`~/.openclaw/extensions/memok-ai/`**. Pipeline settings for the core are written to **`~/.openclaw/extensions/memok-ai/config.toml`** (via **`openclaw memok setup`**).

---

## Features

- **Persist + recall** — store transcripts; inject recall markers; tools `memok_recall_candidate_memories` / `memok_report_used_memory_ids`; configurable recall modes (`skill`, `skill+hint`, `prepend`).
- **Local-first memory** — SQLite under your gateway; no hosted vector API required for the default path.
- **Wizard + UI schema** — **`openclaw memok setup`** and gateway UI hints for LLM provider, keys, and dreaming schedule.
- **Optional dreaming cron** — gateway-side schedule (daily time or cron) for predream / story stages; logs in SQLite `dream_logs`.
- **Bundled skill** — `skills/memok-memory` documents how the agent should use memory tools.

---

## Quick install

You need **Node.js ≥ 20**, **npm**, **git**, and **`openclaw`** on `PATH`. Gateway compatibility: **OpenClaw ≥ 2026.3.24** (see `openclaw.compat` in [package.json](package.json)).

### Linux / macOS — default (core from npm)

Installs **`memok-ai`** from the default registry (`"memok-ai": "^0.2.3"` in `package.json`; plugin imports **`memok-ai/bridge`**).

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/galaxy8691/memok-ai-openclaw/main/scripts/install-linux-macos.sh)
```

### Linux / macOS — China (Gitee clone + npmmirror)

[`scripts/install-cn-linux-macos.sh`](scripts/install-cn-linux-macos.sh) prefers cloning the **plugin** from Gitee and uses **npmmirror** for `npm install`. Optional: **`MEMOK_CORE_GIT_URL`** to install **`memok-ai`** from Git instead of npm.

```bash
bash <(curl -fsSL https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/install-cn-linux-macos.sh)
```

If **`registry.npmjs.org`** is slow, use the China script or set **`MEMOK_NPM_REGISTRY`** before the default installer.

### Windows (PowerShell)

**Default (GitHub raw; core from npm):**

```powershell
irm https://raw.githubusercontent.com/galaxy8691/memok-ai-openclaw/main/scripts/install-windows.ps1 | iex
```

**Clone plugin from Gitee** (installer uses npmmirror for `npm install` when the clone URL is Gitee):

```powershell
$env:MEMOK_REPO_URL = "https://gitee.com/wik20/memok-ai-openclaw.git"
irm https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/install-windows.ps1 | iex
```

**What the installers do:** `npm install` → `npm run build` → `openclaw plugins install` → `openclaw memok setup` → optional gateway restart → remove `~/.openclaw/extensions/memok-ai-openclaw-src` unless **`MEMOK_KEEP_SOURCE=1`**.

**Useful env vars:** `MEMOK_PLUGINS_INSTALL_TIMEOUT_SECONDS`, `MEMOK_PLUGINS_INSTALL_NO_PTY=1`, `MEMOK_SKIP_GATEWAY_RESTART=1`, `MEMOK_GATEWAY_RESTART_TIMEOUT_SECONDS`, `MEMOK_KEEP_SOURCE=1`, `MEMOK_REPO_URL` / `MEMOK_REPO_URL_CN` / `MEMOK_REPO_URL_FALLBACK`, `MEMOK_CORE_GIT_URL`, `MEMOK_CORE_GIT_REF`, `MEMOK_NPM_REGISTRY` — see script headers; [README.zh-CN.md](README.zh-CN.md) has Chinese-oriented notes.

If `plugins.allow` blocks the plugin, add **`"memok"`** under `plugins.allow` in `~/.openclaw/openclaw.json`, then run **`openclaw memok setup`** again.

---

## Getting started

### 1. Install the plugin

Use **Quick install** above, or from a clone:

```bash
git clone https://github.com/galaxy8691/memok-ai-openclaw.git
cd memok-ai-openclaw
npm install && npm run build
openclaw plugins install .
```

Gitee clone + npmmirror:

```bash
git clone https://gitee.com/wik20/memok-ai-openclaw.git
cd memok-ai-openclaw
npm install --registry https://registry.npmmirror.com && npm run build
openclaw plugins install .
```

If npm cannot reach **`memok-ai`**, before `npm install`:  
`npm pkg set dependencies.memok-ai=git+https://gitee.com/wik20/memok-ai.git#v0.1.0`  
**Air-gapped:** point `"memok-ai"` at `"file:/path/to/memok-ai"` in `package.json`, then `npm install`.

### 2. Run the Memok setup wizard

```bash
openclaw memok setup
```

This writes **`~/.openclaw/extensions/memok-ai/config.toml`** (`MemokPipelineConfig`) and aligns gateway-side settings. If that file is missing at startup, the plugin logs an error and skips registration until setup succeeds again.

### 3. Restart the gateway (if prompted)

So the extension and skills load cleanly.

### 4. Use memory in sessions

Open a new OpenClaw session. Recall behavior depends on **`memoryRecallMode`** in plugin config (see `openclaw.plugin.json` / gateway UI). With recall + report flow, **effective use of candidate memories exceeded 95%** in our internal runs — your mileage varies by model and settings.

---

## Core vs plugin

| | Repository | Role |
|---|------------|------|
| **Core** | [galaxy8691/memok-ai](https://github.com/galaxy8691/memok-ai) · [Gitee](https://gitee.com/wik20/memok-ai) | Pipelines, CLI, tests; npm **`memok-ai`**, import **`memok-ai/bridge`**. |
| **Plugin (this repo)** | [galaxy8691/memok-ai-openclaw](https://github.com/galaxy8691/memok-ai-openclaw) · [Gitee](https://gitee.com/wik20/memok-ai-openclaw) | OpenClaw registration, TOML wizard, transcript hooks, skills. |

First **`npm install`** runs **`memok-ai`**’s **`prepare`** → **`npm run build`** (includes native **`better-sqlite3`**; first build can take **minutes** on a cold cache).

---

## Memok vs typical hosted vector stacks

| | Memok (this stack) | Typical hosted vector DB |
|---|-------------------|---------------------------|
| **Deployment** | Local SQLite | Cloud API + billing |
| **Recall** | Word graph, weights, sampling | Embedding similarity |
| **Explainability** | Inspectable rows | Mostly scores |

---

## Architecture

```
┌─────────────────────┐      ┌──────────────────────────┐      ┌─────────────┐
│  OpenClaw gateway   │─────>│  memok-ai-openclaw       │─────>│  memok-ai   │
│  (plugin host)      │      │  (this plugin / skills)  │      │  (npm core) │
└─────────────────────┘      └────────────┬─────────────┘      └──────┬──────┘
                                            │                            │
                                            └────────────────────────────>│
                                                                 ┌───────▼───────┐
                                                                 │ SQLite DB     │
                                                                 │ (memok.sqlite)│
                                                                 └───────────────┘
```

| Layer | Stack |
|-------|--------|
| Gateway | OpenClaw **≥ 2026.3.24** |
| Extension | TypeScript → **`dist/plugin.js`**, `openclaw.plugin.json`, `skills/` |
| Memory engine | **`memok-ai`** (`memok-ai/bridge`), SQLite, optional LLM calls |

---

## OpenClaw commands you’ll touch

| Command | Purpose |
|---------|---------|
| `openclaw plugins install .` | Install from a cloned plugin directory |
| `openclaw memok setup` | Wizard: DB path, LLM, `config.toml`, gateway hints |

Pipelines, dreaming one-shots, and core CLI live in **[memok-ai README](https://github.com/galaxy8691/memok-ai/blob/main/README.md)** / **[README.zh-CN](https://github.com/galaxy8691/memok-ai/blob/main/README.zh-CN.md)**.

---

## Config priority (`OPENAI_*`, `MEMOK_LLM_MODEL`)

1. **Existing environment variables** win.  
2. **Plugin / wizard** fills gaps only.  
3. **Pipeline + LLM** for this plugin: **`~/.openclaw/extensions/memok-ai/config.toml`** (plus `openclaw.json` for cron / recall flags as documented in the gateway).

Most users only need **`openclaw memok setup`**.

---

## Dreaming (plugin cron)

When the dreaming cron runs, each run is stored in SQLite **`dream_logs`**: `dream_date`, `ts`, `status` (`ok` / `error`), `log_json`.

---

## Development

**Prerequisites:** Node.js **≥ 20**, npm.

```bash
git clone https://github.com/galaxy8691/memok-ai-openclaw.git
cd memok-ai-openclaw
npm install
npm run build
npm run ci    # lint + build + tests
```

Git fallback for **`memok-ai`** before `npm install`:

```bash
npm pkg set dependencies.memok-ai=git+https://gitee.com/wik20/memok-ai.git#v0.1.0
npm install
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for extension-only scope and upgrading **`memok-ai`**.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

[MIT License](LICENSE).
