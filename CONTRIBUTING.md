# Contributing to memok-ai-openclaw (OpenClaw plugin repo)

Thanks for contributing.

This tree is the **OpenClaw extension** only. Memory pipelines, SQLite, dreaming, and the `memok-ai` CLI live in **[galaxy8691/memok-ai](https://github.com/galaxy8691/memok-ai)** (Gitee mirror: [wik20/memok-ai](https://gitee.com/wik20/memok-ai)) and are consumed here as the npm dependency **`memok-ai`** (`^0.2.2` in `package.json`; import **`memok-ai/bridge`** for `articleWordPipeline`, `dreamingPipeline`, recall/feedback helpers). **Runtime `MemokPipelineConfig` is read from** `~/.openclaw/extensions/memok-ai/config.toml` (written by `openclaw memok setup`); the plugin does **not** assemble pipelines from `.env`. **`scripts/install-cn-linux-macos.sh`** uses **npmmirror** for `npm install` by default; set **`MEMOK_CORE_GIT_URL`** only if you need to install the core from Git instead of npm.

## Development Setup

- Node.js **≥20** (LTS recommended); OpenClaw gateway **≥2026.3.24** when exercising the plugin (see `openclaw.compat` in [package.json](package.json)).

```bash
npm install
```

Useful commands:

```bash
npm run lint
npm run build
npm test
```

Formatting and linting use [Biome](https://biomejs.dev/) (`biome.json` at repo root). CI runs `npm run ci` (lint, build, test).

## Security and dependencies

- Run `npm audit` periodically; review `npm audit fix` output before applying (semver and breaking changes).
- Bumping **`memok-ai`**: edit the semver range in [package.json](package.json), run `npm install`, verify `npm run ci`, then commit `package.json` and `package-lock.json`. (Git overrides are for exceptional installs only.)
- **After upstream publishes a new `memok-ai` on npm** (for example **0.2.3** with further `MemokPipelineConfig` / pipeline work): run **`npm update memok-ai`**, then **`npm run ci`**, and commit the updated **`package-lock.json`**. With **`^0.2.2`** in [package.json](package.json), new **0.2.x** releases are already semver-compatible; the lockfile is what CI and reproducible installs pin until you refresh it.
- **Patch upgrades within the same range** (e.g. `^0.1.0` → latest `0.1.x`): `package-lock.json` pins the exact tarball CI installs (`npm ci`). End users cloning this repo get that pinned version until maintainers run **`npm update memok-ai`** (or delete the `memok-ai` stanza in the lockfile and re-run `npm install`) and commit the updated lockfile. Installing the plugin via OpenClaw copies whatever `node_modules` was produced from that lockfile, so it does not float to the registry’s latest by itself.

## Pull Request Checklist

Before opening a PR:

- Keep changes focused (one problem per PR when possible)
- Add or update tests for behavior changes
- Run `npm run lint`, `npm run build`, and `npm test`
- Update docs when CLI/plugin behavior changes
- If you change install steps or installer env vars, update both [README.md](README.md) and [README.zh-CN.md](README.zh-CN.md) in the same PR
- Include a clear summary: what changed, why, and how it was verified

## SQLite connections

On-disk memory schema and **`dream_logs`** persistence for the dreaming pipeline live in **`memok-ai`** (`dreamingPipeline` → `persistDreamPipelineLogToDb`). This plugin does not open SQLite directly for dreaming.

### Upgrading `memok-ai` and existing databases

Core releases may change how **`articleWordPipeline`** materializes rows (for example **v2** import paths). Before upgrading **`memok-ai`** on a machine that already has **`~/.openclaw/extensions/memok-ai/memok.sqlite`**, **back up that file**. If **[galaxy8691/memok-ai](https://github.com/galaxy8691/memok-ai)** documents a migration, empty rebuild, or schema bump for a given version, follow upstream; this plugin only passes **`MemokPipelineConfig`** from **`config.toml`** and does not migrate SQLite itself. When in doubt, test against a copy of the DB in a dev gateway.

## Manual gateway verification (optional)

After `npm run build` and installing the plugin into OpenClaw (for example **`openclaw plugins install .`** from a clone):

1. Run **`openclaw memok setup`**, then restart the gateway so **`config.toml`** and env are loaded.
2. Hold a short conversation; in gateway logs, confirm **`[memok-ai] 记忆已保存`** (or inspect **`memok.sqlite`** for expected table growth). If persist is disabled in config, adjust **`persistTranscriptToMemory`** for this check.
3. If **dreaming** cron is enabled in plugin config, after a scheduled run confirm new rows in SQLite table **`dream_logs`**, or run the upstream **memok-ai** CLI dreaming flow against the same **`dbPath`** if you need an immediate signal without waiting for cron.

## Memok pipeline configuration

- **File:** `~/.openclaw/extensions/memok-ai/config.toml` (fixed path).
- **Created by:** `openclaw memok setup` after updating `openclaw.json`.
- **Runtime:** [`loadMemokPipelineConfig`](src/plugin/memokPipelineConfigToml.ts) reads and validates the file; missing/invalid file disables the plugin with an error log (no `.env` fallback for `MemokPipelineConfig`).

## Code Style

- TypeScript + Node.js ESM
- Prefer small, composable functions
- Keep JSON output contracts stable unless migration is documented
- Avoid destructive or backward-incompatible SQLite changes without migration notes

## Testing Guidance

- Add unit tests for new logic and edge cases
- Prefer deterministic tests (inject functions/randomness where needed)
- For SQLite-related code, use temporary databases per test

## Commit Messages

Follow existing history style:

- `feat(...): ...`
- `fix(...): ...`
- `refactor(...): ...`

Keep subject concise and explain motivation in body when needed.

## Reporting Issues

For bugs, please include:

- Repro steps
- Expected vs actual behavior
- Relevant config (`openclaw.plugin.json` / plugin config snippet)
- Logs/errors
- Runtime versions (Node, OpenClaw)
