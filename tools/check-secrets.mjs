import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const failures = [];
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);
const secretPatterns = [
  [/-----BEGIN (?:OPENSSH|RSA|EC|DSA) PRIVATE KEY-----/, "private key"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key"],
  [/\bgh[oprsu]_[A-Za-z0-9_]{30,}\b/, "GitHub token"],
  [/\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}\b/, "API secret"],
];

const tracked = execFileSync("git", ["ls-files", "-z"], {
  cwd: root,
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);

for (const path of tracked) {
  if (/\.(?:key|pem|p12|pfx)$/i.test(path))
    failures.push(`${path}: tracked credential-like file`);
  if (!textExtensions.has(extname(path))) continue;
  const content = readFileSync(join(root, path), "utf8");
  for (const [pattern, label] of secretPatterns)
    if (pattern.test(content)) failures.push(`${path}: possible ${label}`);
  if (
    path.startsWith("src/") &&
    /VITE_[A-Z0-9_]*(?:SECRET|PRIVATE|PASSWORD|TOKEN|API_KEY)/.test(content)
  )
    failures.push(`${path}: secret-like VITE_ variable would be public`);
}

const distRoot = join(root, "dist");
const walk = (directory) => {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) walk(path);
    else {
      const display = relative(root, path);
      if (/\.(?:map|key|pem|p12|pfx)$/i.test(entry) || /^\.env/i.test(entry))
        failures.push(`${display}: forbidden release artifact`);
      if (!textExtensions.has(extname(entry))) continue;
      const content = readFileSync(path, "utf8");
      for (const [pattern, label] of secretPatterns)
        if (pattern.test(content)) failures.push(`${display}: possible ${label}`);
    }
  }
};

try {
  walk(distRoot);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

if (failures.length) {
  console.error(`Secret audit failed:\n${failures.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

console.log(`Secret audit OK: ${tracked.length} tracked files and dist checked`);
