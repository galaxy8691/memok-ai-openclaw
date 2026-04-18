# memok-ai

English | [简体中文](./README.zh-CN.md) · Website: [memok-ai.com](https://www.memok-ai.com/) · Mirror (中文文档 / 境内安装): [Gitee](https://gitee.com/wik20/memok-ai-openclaw)

This **npm package** (`name: memok-ai`) is the **OpenClaw gateway extension** only. The memory engine (article pipeline, SQLite import, dreaming, CLI) lives in the core repo **[galaxy8691/memok-ai](https://github.com/galaxy8691/memok-ai)** (Chinese mirror: **[wik20/memok-ai on Gitee](https://gitee.com/wik20/memok-ai)**). **`package.json` is unified for all regions:** dependency **`memok-ai-core`** points at **`git+https://github.com/galaxy8691/memok-ai.git#v1.1.0`** (includes `prepare` → `npm run build`, so first install compiles native `better-sqlite3`). **Domestic installs** use `install-cn-linux-macos.sh`, which runs `npm pkg set` before `npm install` to switch the core URL to Gitee; the **Windows** installer does the same when `MEMOK_REPO_URL` (or the default clone URL) is a **Gitee** plugin URL. To use a different core host yourself, set `MEMOK_CORE_GIT_URL` before `npm install` or edit `package.json` / `npm pkg set`.

**This repository** ([GitHub](https://github.com/galaxy8691/memok-ai-openclaw), [Gitee mirror](https://gitee.com/wik20/memok-ai-openclaw)) holds the thin plugin sources (`src/plugin.ts`, `openclaw.plugin.json`, skills). Clone/install URLs in docs point at **memok-ai-openclaw**.

## What this plugin repo does

- OpenClaw hooks: transcript persistence, per-turn recall injection, `memok_recall_candidate_memories` / `memok_report_used_memory_ids`, optional dreaming cron
- Interactive `openclaw memok setup` (wizard) and plugin config wiring
- **Core behavior** is delegated to `memok-ai-core` via the stable entry **`memok-ai-core/openclaw-bridge`**

**Evaluation (tested):** With the OpenClaw plugin recall/report flow, effective memory utilization (candidate memories that were actually reflected in assistant replies) **exceeded 95%** in our runs. Your results will depend on model, task, and sampling settings.

### What the OpenClaw plugin does for you

- Per-turn recall: sampled candidates can be injected before each reply, so long threads stay on track without pasting full history every time.
- Reinforcement: calling `memok_report_used_memory_ids` bumps weights for memories you actually used, so frequent facts stay warm.
- Dreaming / predream: optional scheduled jobs run decay, merges, and cleanup—more like maintenance passes over a graph than a pure append-only log.

### How this differs from embedding-only stacks

| | memok-ai | Typical hosted vector DB |
| --- | --- | --- |
| Deployment | SQLite on your machine | Cloud API + billing |
| Recall signal | Word / normalized-word graph, weights, sampling | Embedding similarity |
| Explainability | Structured rows you can inspect | Mostly similarity scores |
| Privacy | Data stays local by default | Usually leaves your host |

That is a trade-off, not a universal “better/worse” on retrieval quality.

### Notes from real OpenClaw use

Heavy users report coherent follow-up across sessions (e.g. performance work, architecture, release tooling), stable feedback when citing memories, and predream/dreaming behaving as expected once scheduled. Active databases in the wild have reached on the order of ~1k sentences and 100k+ link rows—enough to exercise recall at non-trivial scale; your numbers will differ.

Informal timing on typical local setups (SSD, modest DB size) is often on the order of ~10² ms to persist a turn and sub-100 ms for recall queries—indicative only, not a SLA. Informal “recall accuracy %” figures from the community are anecdotes unless you reproduce them on your workload.

In short: memok targets an associative, reinforceable, optionally forgetful loop without managing embedding models or a separate vector service—closer to a structured “notebook graph” than a generic semantic index.

## Requirements

- Node.js **≥20** (LTS recommended)
- npm

**OpenClaw plugin:** gateway **≥2026.3.24** and plugin API **≥2026.3.24** (see `openclaw.compat` in [package.json](package.json)).

Install dependencies:

```bash
npm install
```

**First-time install note:** `openclaw` is **not** listed here (the gateway supplies it at runtime). Plain `npm install` in this repo resolves **`memok-ai-core` from GitHub** per `package.json` / `package-lock.json`; that step pulls **`better-sqlite3`** and can take **several minutes** on a cold cache. Avoid `--loglevel verbose` for routine installs. If `.npmrc` is present (e.g. npmmirror), it applies to this install too.

**China:** use **`install-cn-linux-macos.sh`**, which rewrites `memok-ai-core` to the **Gitee** mirror before `npm install`. **Windows:** if you clone the plugin from **Gitee** (`MEMOK_REPO_URL` or URL contains `gitee.com`), the installer switches the core dependency to Gitee the same way.

**Optional override:** set `MEMOK_CORE_GIT_URL` (and optional `MEMOK_CORE_GIT_REF`) before `npm install` / before the install script’s `npm install` step to point `memok-ai-core` at any Git HTTPS URL you need.

**Air-gapped:** clone core locally, run `npm install && npm run build` there, then set `package.json` to `"memok-ai-core": "file:../memok-ai"` (adjust path) and `npm install`.

## Installation

### 1) CLI / article & dreaming pipelines

Use the **core** repository: [galaxy8691/memok-ai](https://github.com/galaxy8691/memok-ai) (`memok-ai` CLI, `npm run dev -- …`, tests, CI).

### 2) Use as OpenClaw plugin

Install via script (recommended):

```bash
# Linux / macOS
bash <(curl -fsSL https://raw.githubusercontent.com/galaxy8691/memok-ai-openclaw/main/scripts/install-linux-macos.sh)
```

```powershell
# Windows PowerShell
irm https://raw.githubusercontent.com/galaxy8691/memok-ai-openclaw/main/scripts/install-windows.ps1 | iex
```

```cmd
:: Windows CMD (download then run)
curl -L -o install-windows.cmd https://raw.githubusercontent.com/galaxy8691/memok-ai-openclaw/main/scripts/install-windows.cmd
install-windows.cmd
```

Installer behavior:

- Auto runs `npm install` + `npm run build`
- Auto installs plugin via `openclaw plugins install`
- Runs `openclaw memok setup`, then on success attempts `openclaw gateway restart` (fallback: `openclaw restart`) so changes apply
- Auto removes install source directory (`~/.openclaw/extensions/memok-ai-src`) after success

Useful installer env vars:

- `MEMOK_PLUGINS_INSTALL_TIMEOUT_SECONDS` (optional; seconds cap for `openclaw plugins install`, `0` = no limit)
- `MEMOK_PLUGINS_INSTALL_NO_PTY=1` (Linux: skip `script`-based pseudo-TTY wrapper; use if the default wrapper misbehaves)
- `MEMOK_SKIP_GATEWAY_RESTART=1` (skip the final gateway restart step)
- `MEMOK_GATEWAY_RESTART_TIMEOUT_SECONDS` (default `120`; Bash uses `timeout` when available; PowerShell uses `Start-Process` + `WaitForExit` for the same cap on gateway restart)
- `MEMOK_KEEP_SOURCE=1` (keep source directory for debugging)
- `MEMOK_CORE_GIT_URL` (optional; **`package.json` defaults to GitHub** for `memok-ai-core`. Set this to override the core clone URL before `npm install` — e.g. `https://gitee.com/wik20/memok-ai.git` when using the generic installer without editing files)
- `MEMOK_CORE_GIT_REF` (optional; Git tag/ref for core, default **`v1.1.0`** — must exist on the host you use)

If `openclaw plugins install` prints success but never returns (so the installer never reaches the next line), that is usually OpenClaw’s CLI not exiting; on **Linux**, the Bash installer can run the command inside `script` (pseudo-TTY) unless `MEMOK_PLUGINS_INSTALL_NO_PTY=1`. The **PowerShell** installer calls `openclaw` directly (no PTY wrapper). You can `Ctrl+C` and run `openclaw memok setup` if the plugin files are already installed. Avoid registering the same plugin twice (e.g. both `memok-ai` and `memok-ai-src` paths) — remove the duplicate entry in `openclaw.json` to silence “duplicate plugin id” warnings.

If setup fails with `plugins.allow excludes "memok"`, add `"memok"` to `~/.openclaw/openclaw.json` under `plugins.allow`, then rerun:

```bash
openclaw memok setup
```

Manual fallback:

```bash
git clone https://github.com/galaxy8691/memok-ai-openclaw.git
cd memok-ai-openclaw
npm install
npm run build
openclaw plugins install .
openclaw memok setup
```

The setup wizard lets you configure:

- LLM provider / API key / model preset (with manual model override)
- Optional memory-slot exclusivity (default: non-exclusive)
- Dreaming schedule (`dailyAt` / cron / timezone)

If you change plugins or config outside the installer, restart the gateway so the running process picks them up (for example `openclaw gateway restart`).

## CLI / pipelines / one-shot dreaming

See the **core** repo [README](https://github.com/galaxy8691/memok-ai/blob/main/README.md) and [README.zh-CN](https://github.com/galaxy8691/memok-ai/blob/main/README.zh-CN.md) (`memok-ai` CLI).

## Dreaming (plugin)

When plugin dreaming cron is enabled, each run is persisted in SQLite table `dream_logs`:

- `dream_date`
- `ts`
- `status` (`ok` / `error`)
- `log_json` (full run payload)

## Configuration Priority (Important)

For `OPENAI_API_KEY`, `OPENAI_BASE_URL`, and `MEMOK_LLM_MODEL`:

1. Existing process environment variables win
2. Plugin config only fills missing values
3. `.env` is mainly for **core** CLI development in [memok-ai](https://github.com/galaxy8691/memok-ai)

So plugin users can rely on `openclaw memok setup` without requiring a local `.env`.

## Contributing

Contributions are welcome. See the full guide: [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

Released under the [MIT License](LICENSE).
