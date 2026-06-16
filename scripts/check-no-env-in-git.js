#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const SECRET_PATTERNS = [/mongodb\+srv:\/\//i, /DB_URL\s*=\s*mongodb/i];

function git(cmd) {
  try {
    return execSync(cmd, { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const tracked = git("git ls-files").split(/\r?\n/).filter(Boolean);
const envTracked = tracked.filter((f) => f === ".env" || f.endsWith("/.env"));
const errors = envTracked.length ? [`Tracked .env: ${envTracked.join(", ")}`] : [];

for (const file of tracked) {
  if (!existsSync(join(root, file)) || file.endsWith(".example")) continue;
  if (file === "README.md" || file.endsWith("/README.md")) continue;
  const content = readFileSync(join(root, file), "utf8");
  if (SECRET_PATTERNS.some((p) => p.test(content))) {
    errors.push(`Possible secret in ${file}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("Secret guard OK");
