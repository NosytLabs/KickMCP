import { rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const targets = ["dist", "web-dist"];

for (const target of targets) {
  const resolved = path.resolve(root, target);
  const relative = path.relative(root, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to remove path outside workspace: ${resolved}`);
  }

  await rm(resolved, { recursive: true, force: true });
}
