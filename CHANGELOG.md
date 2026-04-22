# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Bump `memok-ai` dependency to `^0.3.0`.

### Added

- Support for `MemokPipelineConfig.relevanceScoreMaxLlmAttempts` in `config.toml` parsing, wizard generation (`buildMemokPipelineConfigForWizard`), and `openclaw.plugin.json` schema (range 1–32; core default 5).

## [0.1.1] - 2026-04-21

### Added

- `openclaw.build` in `package.json` with **`openclawVersion`** and **`pluginSdkVersion`** required for ClawHub publishing (aligned with `compat` at `2026.3.24`).

### Changed

- **Copy and comments**: user-facing and log strings are **English-first with short Chinese where helpful**; source comments are English throughout. Covers the plugin core, `openclaw.plugin.json`, `config.toml.example`, install scripts, `skills/memok-memory/SKILL.md`, `CONTRIBUTING.md`, and related files. **`README.zh-CN.md` stays Chinese-only** (not converted to English-first).
- **`memokPipelineConfigToml`**: validation and parse error messages are English for consistency with gateway logs and i18n-friendly tooling.
- Tests that assert those error messages were updated (still matching on field names and message content where needed).

### Notes

- Legacy transcript markers and compatibility paths for older sessions were **kept** to avoid breaking existing data.
