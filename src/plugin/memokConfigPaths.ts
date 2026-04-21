import { homedir } from "node:os";
import { join } from "node:path";

/** Fixed path for Memok pipeline TOML under the extension root (same folder as default `memok.sqlite`). */
export function getMemokExtensionConfigTomlPath(): string {
  return join(homedir(), ".openclaw/extensions/memok-ai", "config.toml");
}
