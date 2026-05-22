import { spawnSync } from "node:child_process";

const result =
  process.platform === "win32"
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", "npm pack --dry-run --json --ignore-scripts"], {
        cwd: process.cwd(),
        encoding: "utf8",
      })
    : spawnSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
        cwd: process.cwd(),
        encoding: "utf8",
      });

if (result.status !== 0) {
  if (result.error) console.error(result.error.message);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exit(result.status ?? 1);
}

const packs = JSON.parse(result.stdout);
const files = packs.flatMap((pack) => pack.files.map((file) => file.path));
const forbiddenPatterns = [
  /^web-dist\//,
  new RegExp("^dist/" + "wid" + "get/"),
  new RegExp("chat" + "gpt", "i"),
  new RegExp("open" + "ai", "i"),
  new RegExp("apps" + "-sdk", "i"),
];

const forbidden = files.filter((file) => forbiddenPatterns.some((pattern) => pattern.test(file)));

if (forbidden.length) {
  console.error("Package contains removed UI artifacts:");
  for (const file of forbidden) console.error(`- ${file}`);
  process.exit(1);
}

for (const required of ["dist/stdio.js", "dist/server.js", "dist/mcp.js", "README.md", "server.json"]) {
  if (!files.includes(required)) {
    console.error(`Package is missing required file: ${required}`);
    process.exit(1);
  }
}

console.log(`ok package contents: ${files.length} files`);
