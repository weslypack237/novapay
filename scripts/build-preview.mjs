// Builds a static, click-through copy of the website into ./preview
// so it can be opened with VS Code Live Server ("Go Live").
// Demo data only: no server, no database, no real money.
//
// Usage (from the novapay folder, after `npm install` in apps/web):
//   node scripts/build-preview.mjs
import { cpSync, rmSync, writeFileSync, symlinkSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const web = join(root, "apps", "web");
const work = join(root, ".preview-build");

if (!existsSync(join(web, "node_modules"))) {
  console.error("Run `npm install` inside apps/web first.");
  process.exit(1);
}

rmSync(work, { recursive: true, force: true });
cpSync(web, work, { recursive: true, filter: (src) => !/[\\/](node_modules|\.next)([\\/]|$)/.test(src.slice(web.length)) });
symlinkSync(join(web, "node_modules"), join(work, "node_modules"), "junction");

// Server-only parts can't exist in plain HTML: API routes, the login gate, redirect stubs.
for (const p of ["src/app/api", "src/proxy.ts", "src/app/app/transactions", "src/app/app/settings"]) {
  rmSync(join(work, p), { recursive: true, force: true });
}

writeFileSync(join(work, "next.config.ts"), `import type { NextConfig } from "next";
const config: NextConfig = {
  output: "export",
  trailingSlash: true, // /app/cards/ -> app/cards/index.html
  images: { unoptimized: true },
  turbopack: {
    root: ${JSON.stringify(root)},
    rules: { "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" } },
  },
};
export default config;
`);

try {
  execSync("npx next build", {
    cwd: work,
    stdio: "inherit",
    env: { ...process.env, NEXT_PUBLIC_STATIC_PREVIEW: "true", NEXT_TELEMETRY_DISABLED: "1" },
  });
  rmSync(join(root, "preview"), { recursive: true, force: true });
  cpSync(join(work, "out"), join(root, "preview"), { recursive: true });
  console.log("\nDone. Open the novapay folder in VS Code and click Go Live.");
} finally {
  rmSync(work, { recursive: true, force: true });
}
