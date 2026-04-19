import { homedir } from "node:os";
import { join } from "node:path";

/** 固定扩展根目录下的 Memok 管线配置（与默认 `memok.sqlite` 同目录）。 */
export function getMemokExtensionConfigTomlPath(): string {
  return join(homedir(), ".openclaw/extensions/memok-ai", "config.toml");
}
