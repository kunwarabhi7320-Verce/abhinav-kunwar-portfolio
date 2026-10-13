"use strict";

/**
 * Builds Sanity Studio (studio/) so the portfolio server can host it at /studio.
 * Runs on Render as part of the build command. Uses SANITY_PROJECT_ID / SANITY_DATASET,
 * the same variables as the website, so there is one place to configure the project.
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

const env = { ...process.env, SANITY_STUDIO_PROJECT_ID: projectId, SANITY_STUDIO_DATASET: dataset };
const run = cmd => execSync(cmd, { cwd: STUDIO, env, stdio: "inherit" });

console.log(`Building Sanity Studio for ${projectId}/${dataset} → /studio`);
run("npm ci --no-audit --no-fund");
// Self-contained build (no runtime auto-updates), so the Studio only changes when this repository does.
run("npx sanity build dist --yes --no-auto-updates");
console.log("Studio build complete: studio/dist");
