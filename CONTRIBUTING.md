# Contributing to memok-ai (OpenClaw plugin repo)

Thanks for contributing.

This tree is the **OpenClaw extension** only. Memory pipelines, SQLite, dreaming, and the `memok-ai` CLI live in **[galaxy8691/memok-ai](https://github.com/galaxy8691/memok-ai)** (Gitee mirror: [wik20/memok-ai](https://gitee.com/wik20/memok-ai)) and are consumed here as **`memok-ai-core`**. **`package.json` pins the GitHub URL** for a single canonical lockfile; **`scripts/install-cn-linux-macos.sh`** rewrites `memok-ai-core` to the Gitee URL before `npm install` for China installs.

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
- Bumping **`memok-ai-core`**: edit the git tag/commit in [package.json](package.json), run `npm install`, verify `npm run ci`, then commit `package.json` and `package-lock.json`.

## Pull Request Checklist

Before opening a PR:

- Keep changes focused (one problem per PR when possible)
- Add or update tests for behavior changes
- Run `npm run lint`, `npm run build`, and `npm test`
- Update docs when CLI/plugin behavior changes
- If you change install steps or installer env vars, update both [README.md](README.md) and [README.zh-CN.md](README.zh-CN.md) in the same PR
- Include a clear summary: what changed, why, and how it was verified

## SQLite connections

On-disk DB access is implemented in **`memok-ai-core`** (see `openSqlite` in the core repo). This plugin repo does not ship SQLite helpers.

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
