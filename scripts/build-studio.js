"use strict";

/**
 * Builds Sanity Studio (studio/) so the website can host it at /studio.
 *   node scripts/build-studio.js               → studio/dist (served by server.js on Render)
 *   node scripts/build-studio.js --out dist/studio → inside the static site (GitHub Pages, abhinavkunwar.me/studio)
 * Uses SANITY_PROJECT_ID / SANITY_DATASET, the same variables as the website, so there is one place to
 * configure the project. BASE_PATH (sub-folder of the static site, "" for a custom domain) is respected.
 * Skips quietly when no project is configured.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const STUDIO = path.join(__dirname, "..", "studio");
const projectId = (process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID || "").trim();
const dataset = (process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || "production").trim();

if (!/^[a-z0-9-]+$/i.test(projectId)) {
  console.log("Studio build skipped: SANITY_PROJECT_ID is not set.");
  process.exit(0);
}
if (!fs.existsSync(path.join(STUDIO, "package.json"))) {
  console.log("Studio build skipped: studio/ folder not found.");
  process.exit(0);
}

const outArg = process.argv.indexOf("--out");
const outDir = outArg > -1 && process.argv[outArg + 1] ? path.resolve(process.argv[outArg + 1]) : path.join(STUDIO, "dist");
const basePath = `${(process.env.BASE_PATH || "").replace(/\/+$/, "")}/studio`;
if (!/^[\w\/-]+$/.test(basePath)) { console.error(`Invalid BASE_PATH: ${process.env.BASE_PATH}`); process.exit(1); }

const env = { ...process.env, SANITY_STUDIO_PROJECT_ID: projectId, SANITY_STUDIO_DATASET: dataset, SANITY_STUDIO_BASEPATH: basePath };
const run = cmd => execSync(cmd, { cwd: STUDIO, env, stdio: "inherit" });

console.log(`Building Sanity Studio for ${projectId}/${dataset} → ${basePath} (${path.relative(process.cwd(), outDir) || outDir})`);
if (!process.argv.includes("--skip-install")) run("npm ci --no-audit --no-fund");
// Self-contained build (auto-updates are off in studio/sanity.cli.js).
run(`npx sanity build ${JSON.stringify(outDir)} --yes`);
// The Studio links its icons from /static/…; point them at its own folder so they also load on GitHub Pages.
{
  const index = path.join(outDir, "index.html");
  const html = fs.readFileSync(index, "utf8").replace(/(href=")\/static\/([\w.-]+)"/g, (m, a, file) =>
    fs.existsSync(path.join(outDir, "static", file)) ? `${a}${basePath}/static/${file}"` : m);
  fs.writeFileSync(index, html);
}
console.log("Studio build complete");
