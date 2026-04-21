#!/usr/bin/env bash
set -euo pipefail

# Some environments: openclaw child waits on stdin; attach stdin to controlling TTY to avoid "Installed plugin" then hang.
if [ -r /dev/tty ]; then
  exec < /dev/tty || true
fi

# China-optimized installer:
# - Default clone: Gitee (mirror / CN-friendly). 中文：默认 Gitee。
# - Override: MEMOK_REPO_URL_CN; fallback: MEMOK_REPO_URL_FALLBACK (default GitHub)
# - npm install uses mirror registry by default

REPO_URL_CN="${MEMOK_REPO_URL_CN:-https://gitee.com/wik20/memok-ai-openclaw.git}"
REPO_URL_FALLBACK="${MEMOK_REPO_URL_FALLBACK:-https://github.com/galaxy8691/memok-ai-openclaw.git}"
TARGET_DIR="${MEMOK_INSTALL_DIR:-$HOME/.openclaw/extensions/memok-ai-openclaw-src}"
NPM_REGISTRY="${MEMOK_NPM_REGISTRY:-https://registry.npmmirror.com}"

# Optional: coreutils `timeout` caps command duration when installed.
run_with_timeout() {
  local seconds="$1"
  shift
  if command -v timeout >/dev/null 2>&1; then
    timeout "$seconds" "$@"
  else
    "$@"
  fi
}

# OpenClaw may print Installed plugin but not exit; on Linux use `script` for a PTY unless MEMOK_PLUGINS_INSTALL_NO_PTY=1.
run_openclaw_plugins_install() {
  local dir="$1"
  if [ "${MEMOK_PLUGINS_INSTALL_NO_PTY:-0}" != "1" ] && [ "$(uname -s)" = Linux ] && command -v script >/dev/null 2>&1; then
    echo "[memok-ai cn installer] Installing plugin via pseudo-TTY (Linux; reduces hang after last log). (中文：伪终端安装)"
    script -qec "openclaw plugins install $(printf %q "$dir")" /dev/null
  else
    openclaw plugins install "$dir"
  fi
}

# After setup the extension dir already exists (name = openclaw.plugin.json id, currently memok-ai); re-run plugins install would error.
# Sync only build outputs + manifest; keep memok.sqlite, .env, node_modules.
sync_memok_installed_plugin_from_source() {
  local src="$1"
  local name dest
  # Extension dir name follows openclaw.plugin.json id (memok-ai), not package.json name.
  name="$(cd "$src" && node -p "(() => { const fs=require('fs'); const o=JSON.parse(fs.readFileSync('openclaw.plugin.json','utf8')); const id=o&&o.id&&String(o.id).trim(); return id||require('./package.json').name; })()")"
  dest="$(dirname "$src")/$name"
  if [ ! -d "$dest" ] || [ ! -f "$dest/package.json" ]; then
    echo "[memok-ai cn installer] Installed dir not found at $dest; running openclaw plugins install… (中文：未找到已安装目录)"
    run_openclaw_plugins_install "$src"
    return
  fi
  echo "[memok-ai cn installer] Syncing dist/, openclaw.plugin.json, skills/ to $dest … (中文：同步构建产物)"
  rm -rf "$dest/dist"
  cp -a "$src/dist" "$dest/"
  cp -f "$src/openclaw.plugin.json" "$dest/"
  if [ -d "$src/skills" ]; then
    rm -rf "$dest/skills"
    cp -a "$src/skills" "$dest/"
  fi
  if [ -f "$src/LICENSE" ]; then
    cp -f "$src/LICENSE" "$dest/"
  fi
}

restart_gateway_end() {
  if [ "${MEMOK_SKIP_GATEWAY_RESTART:-0}" = "1" ]; then
    echo "[memok-ai cn installer] Skipped gateway restart (MEMOK_SKIP_GATEWAY_RESTART=1). Run: openclaw gateway restart (中文：已跳过重启)"
    return 0
  fi
  local gw_timeout="${MEMOK_GATEWAY_RESTART_TIMEOUT_SECONDS:-120}"
  echo "[memok-ai cn installer] Restarting OpenClaw gateway… (中文：正在重启网关)"
  if run_with_timeout "$gw_timeout" openclaw gateway restart; then
    return 0
  fi
  if run_with_timeout "$gw_timeout" openclaw restart; then
    return 0
  fi
  echo "[memok-ai cn installer] Warning: gateway restart failed or timed out (${gw_timeout}s). Run manually: openclaw gateway restart (中文：重启失败)" >&2
  return 1
}

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[memok-ai cn installer] Missing required command: $1 (中文：缺少命令)" >&2
    exit 1
  fi
}

cleanup_source_dir() {
  if [ "${MEMOK_KEEP_SOURCE:-0}" = "1" ]; then
    echo "[memok-ai cn installer] Keeping source dir: $TARGET_DIR (MEMOK_KEEP_SOURCE=1) (中文：保留源码)"
    return
  fi
  if [ -d "$TARGET_DIR" ]; then
    rm -rf "$TARGET_DIR"
    echo "[memok-ai cn installer] Removed source dir: $TARGET_DIR (中文：已删源码目录)"
  fi
}

clone_or_update_repo() {
  local primary="$1"
  local fallback="$2"

  if [ -d "$TARGET_DIR/.git" ]; then
    echo "[memok-ai cn installer] Updating source from configured remote… (中文：更新源码)"
    if ! git -C "$TARGET_DIR" fetch --depth=1 "$primary" main; then
      echo "[memok-ai cn installer] Primary fetch failed; trying fallback… (中文：主源失败，试备用)"
      git -C "$TARGET_DIR" fetch --depth=1 "$fallback" main
    fi
    git -C "$TARGET_DIR" checkout -f FETCH_HEAD
    return
  fi

  rm -rf "$TARGET_DIR"
  mkdir -p "$(dirname "$TARGET_DIR")"
  echo "[memok-ai cn installer] Cloning from primary… (中文：主源克隆)"
  if ! git clone --depth=1 "$primary" "$TARGET_DIR"; then
    echo "[memok-ai cn installer] Primary clone failed; using fallback… (中文：改用备用源)"
    git clone --depth=1 "$fallback" "$TARGET_DIR"
  fi
}

need_cmd git
need_cmd openclaw
need_cmd npm
need_cmd node

echo "[memok-ai cn installer] Clone/update source… (中文：克隆/更新)"
clone_or_update_repo "$REPO_URL_CN" "$REPO_URL_FALLBACK"

# Core `memok-ai` is on npm; this script uses the mirror registry by default.
# For Git-based core (offline / mirror lag), set MEMOK_CORE_GIT_URL (optional MEMOK_CORE_GIT_REF, default v0.1.0).
patch_memok_core_dependency_optional_git() {
  local prefix="$1"
  local ref="${MEMOK_CORE_GIT_REF:-v0.1.0}"
  if [ -z "${MEMOK_CORE_GIT_URL:-}" ]; then
    return
  fi
  echo "[memok-ai cn installer] MEMOK_CORE_GIT_URL set — memok-ai -> git+${MEMOK_CORE_GIT_URL}#${ref} (中文：核心改 Git 源)"
  npm --prefix "$prefix" pkg set "dependencies.memok-ai=git+${MEMOK_CORE_GIT_URL}#${ref}"
}

patch_memok_core_dependency_optional_git "$TARGET_DIR"

echo "[memok-ai cn installer] Building plugin (registry: $NPM_REGISTRY)… (中文：构建)"
npm --prefix "$TARGET_DIR" install --registry "$NPM_REGISTRY" --prefer-offline --no-audit --progress=false
npm --prefix "$TARGET_DIR" run build

echo "[memok-ai cn installer] Running openclaw plugins install (may take a while)… (中文：安装插件)"
echo "[memok-ai cn installer] If OpenClaw printed Installed plugin but this step never finishes, the CLI may be stuck; try MEMOK_PLUGINS_INSTALL_NO_PTY=1 or Ctrl+C then: openclaw memok setup (中文：卡住时可试 NO_PTY)"
plugins_to="${MEMOK_PLUGINS_INSTALL_TIMEOUT_SECONDS:-0}"
if [ "$plugins_to" -gt 0 ] 2>/dev/null; then
  echo "[memok-ai cn installer] plugins install timeout: ${plugins_to}s (MEMOK_PLUGINS_INSTALL_TIMEOUT_SECONDS; 0 = no limit) (中文：安装超时)"
  if ! run_with_timeout "$plugins_to" bash -c "$(declare -f run_openclaw_plugins_install); run_openclaw_plugins_install \"\$1\"" _ "$TARGET_DIR"; then
    echo "[memok-ai cn installer] Error: openclaw plugins install failed or timed out. (中文：安装失败)" >&2
    echo "[memok-ai cn installer] Manual: openclaw plugins install \"$TARGET_DIR\"" >&2
    exit 1
  fi
else
  run_openclaw_plugins_install "$TARGET_DIR"
fi

echo "[memok-ai cn installer] Plugin install done; next: openclaw memok setup (then gateway restart). (中文：接下来运行 setup)"

echo "[memok-ai cn installer] Running interactive setup… (中文：交互配置)"
# Do NOT capture stdout/stderr: `openclaw memok setup` uses readline prompts; command substitution
# would hide all questions and look like a hang while still waiting for stdin.
set +e
openclaw memok setup
SETUP_STATUS=$?
set -e

if [ $SETUP_STATUS -ne 0 ]; then
  echo "[memok-ai cn installer] Setup exited with status: ${SETUP_STATUS} (中文：setup 退出码)"
  echo "[memok-ai cn installer] If memok is unknown, upgrade OpenClaw to >= 2026.3.24. (中文：升级网关)"
  echo "[memok-ai cn installer] If blocked by plugins.allow, add \"memok\" under plugins.allow in ~/.openclaw/openclaw.json"
  echo "[memok-ai cn installer] Run manually: openclaw memok setup"
  exit $SETUP_STATUS
fi

echo "[memok-ai cn installer] Setup OK; rebuilding and syncing to installed extension (no second plugins install). (中文：同步已安装目录)"
npm --prefix "$TARGET_DIR" run build
sync_memok_installed_plugin_from_source "$TARGET_DIR"

cleanup_source_dir

set +e
restart_gateway_end
set -e

echo
echo "[memok-ai cn installer] All done. (中文：全部完成)"
