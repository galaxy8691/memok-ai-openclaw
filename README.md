# Memok AI — OpenClaw plugin

English | [简体中文](./README.zh-CN.md) · Website: [memok-ai.com](https://www.memok-ai.com/) · Plugin mirror: [Gitee](https://gitee.com/wik20/memok-ai-openclaw)

This repository is the **OpenClaw gateway extension** for Memok memory. The **npm package name** for this repo is **`memok-ai-openclaw`**. After **`openclaw plugins install`**, OpenClaw puts the extension under **`~/.openclaw/extensions/<plugin id>/`**, where **`<plugin id>`** comes from **`openclaw.plugin.json` → `id`** (currently **`memok-ai`**), **not** from `package.json` name — so the live folder is **`~/.openclaw/extensions/memok-ai/`**. The **full memory engine** is the separate npm package **[`memok-ai`](https://www.npmjs.com/package/memok-ai)**; details below after install.

## Requirements

- Node.js **≥20** (LTS recommended), **npm**
- OpenClaw gateway **≥2026.3.24** (see `openclaw.compat` in [package.json](package.json))

## Install (OpenClaw plugin)

**One-line install:** paste into a terminal. **`curl -fsSL`** downloads the script from the raw URL; **`bash <(...)`** runs it in one step (process substitution—no separate “save file then chmod” step). You need **`git`**, **`node`**, **`npm`**, and **`openclaw`** already on your `PATH`.

### Linux / macOS — default (npm registry for `memok-ai`)

[`scripts/install-linux-macos.sh`](scripts/install-linux-macos.sh) — installs core from **[npm `memok-ai`](https://www.npmjs.com/package/memok-ai)** (`"memok-ai": "^0.1.4"` in `package.json`; imports use **`memok-ai/bridge`**).

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/galaxy8691/memok-ai-openclaw/main/scripts/install-linux-macos.sh)
```

### Linux / macOS — mainland China (Gitee clone + npmmirror)

[`scripts/install-cn-linux-macos.sh`](scripts/install-cn-linux-macos.sh) — clones the **plugin** from Gitee when possible, then **`npm install --registry`** (default **npmmirror**) so **`memok-ai`** is fetched from the mirror. Optional: set **`MEMOK_CORE_GIT_URL`** to force **`memok-ai`** from Git instead of npm.

```bash
bash <(curl -fsSL https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/install-cn-linux-macos.sh)
```

If **`registry.npmjs.org`** is slow or blocked, use the **China** line (npmmirror) or set **`MEMOK_NPM_REGISTRY`** before **`install-linux-macos.sh`**. If the **`memok-ai`** tarball is unavailable on your registry, set **`MEMOK_CORE_GIT_URL`** (optional **`MEMOK_CORE_GIT_REF`**) to install the core from Git.

If you already cloned this repo:

```bash
bash scripts/install-linux-macos.sh          # from repo root — same as curl one-liner
# or
bash scripts/install-cn-linux-macos.sh
```

### Windows

[`scripts/install-windows.ps1`](scripts/install-windows.ps1) — **`irm`** downloads the script; **`| iex`** runs it.

**Default (GitHub raw; core from npm):**

```powershell
irm https://raw.githubusercontent.com/galaxy8691/memok-ai-openclaw/main/scripts/install-windows.ps1 | iex
```

**Clone plugin from Gitee** (installer uses **npmmirror** for `npm install` when the clone URL is Gitee):

```powershell
$env:MEMOK_REPO_URL = "https://gitee.com/wik20/memok-ai-openclaw.git"
irm https://gitee.com/wik20/memok-ai-openclaw/raw/main/scripts/install-windows.ps1 | iex
```

**What the installers do:** `npm install` → `npm run build` → `openclaw plugins install` → `openclaw memok setup` → optional gateway restart → remove `~/.openclaw/extensions/memok-ai-openclaw-src` unless **`MEMOK_KEEP_SOURCE=1`**.

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

**From Gitee** (use a China-friendly registry so **`memok-ai`** resolves quickly):

```bash
git clone https://gitee.com/wik20/memok-ai-openclaw.git
cd memok-ai-openclaw
npm install --registry https://registry.npmmirror.com && npm run build
openclaw plugins install .
openclaw memok setup
```

If you **cannot** use npm for the core package, **before** `npm install`:  
`npm pkg set dependencies.memok-ai=git+https://gitee.com/wik20/memok-ai.git#v0.1.0`

**Air-gapped:** build core locally, then set `"memok-ai": "file:/path/to/memok-ai"` in `package.json` and `npm install`.

## Core vs plugin (repos)

|                        | Repository                                                                                                                                  | Role                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Core**               | [galaxy8691/memok-ai](https://github.com/galaxy8691/memok-ai) · [Gitee mirror](https://gitee.com/wik20/memok-ai)                            | Pipelines, CLI, tests; npm **`memok-ai`**, import **`memok-ai/bridge`**. |
| **Plugin (this repo)** | [galaxy8691/memok-ai-openclaw](https://github.com/galaxy8691/memok-ai-openclaw) · [Gitee mirror](https://gitee.com/wik20/memok-ai-openclaw) | `src/plugin.ts`, `openclaw.plugin.json`, `skills/` only.                                           |

**Single `package.json`:** dependency **`memok-ai`** at **`^0.1.4`** ([`memok-ai` on npm](https://www.npmjs.com/package/memok-ai); plugin code imports **`memok-ai/bridge`**). First `npm install` runs that package’s **`prepare`** → `npm run build` (includes native **`better-sqlite3`**, often **minutes** on a cold cache).

**China:** use **`install-cn-linux-macos.sh`** (npmmirror) or **`MEMOK_NPM_REGISTRY`**. **Git fallback for core:** set **`MEMOK_CORE_GIT_URL`** (and optional **`MEMOK_CORE_GIT_REF`**) before `npm install`.

## Development (clone this repo)

```bash
git clone https://github.com/galaxy8691/memok-ai-openclaw.git
cd memok-ai-openclaw
npm install   # installs memok-ai from npm
npm run build
npm run ci    # lint + build + tests
```

If you **cannot** pull **`memok-ai`** from npm, **before** `npm install`:

```bash
npm pkg set dependencies.memok-ai=git+https://gitee.com/wik20/memok-ai.git#v0.1.0
npm install
```

## What the plugin does

- Persists transcripts, per-turn recall (`before_prompt_build`), tools `memok_recall_candidate_memories` / `memok_report_used_memory_ids`, optional dreaming cron
- `openclaw memok setup` wizard and plugin config

**Evaluation (tested):** with recall + report flow, effective use of candidate memories **exceeded 95%** in our runs; your mileage varies by model and settings.

### Compared to embedding-only stacks

|                | Memok                         | Typical hosted vector DB |
| -------------- | ----------------------------- | ------------------------ |
| Deployment     | Local SQLite                  | Cloud API + billing      |
| Recall         | Word graph, weights, sampling | Embedding similarity     |
| Explainability | Inspectable rows              | Mostly scores            |

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
