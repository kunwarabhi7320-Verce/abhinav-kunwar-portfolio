"use strict";

/**
 * Abhinav Kunwar — portfolio server.
 * Serves the static site in ./public. All page navigation happens in the browser
 * (hash routes such as /#ai, /#motion-long, /#about), so the server only needs
 * to deliver index.html and its assets.
 */
require("dotenv").config({ quiet: true }); // loads .env (email credentials) if present
const path = require("path");
const express = require("express");
const contact = require("./lib/contact");

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const isProd = process.env.NODE_ENV === "production";
const PUBLIC_DIR = path.join(__dirname, "public");
const INDEX = path.join(PUBLIC_DIR, "index.html");

const app = express();
app.disable("x-powered-by");
// Behind a hosting proxy (Render, Railway, Fly…) this gives the real visitor IP for rate limiting.
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(
  express.static(PUBLIC_DIR, {
    index: "index.html",
    etag: true,
    setHeaders(res, filePath) {
      if (!isProd || filePath.endsWith(".html")) {
        // Always revalidate the page (and everything in development) so edits show on refresh.
        res.setHeader("Cache-Control", "no-cache");
      } else if (/\.(webp|png|jpe?g|svg|woff2?)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=604800"); // images: 7 days
      } else {
        res.setHeader("Cache-Control", "public, max-age=3600"); // css/js: 1 hour
      }
    },
  })
);

// Contact form → email.
app.use(contact.router);
app.use("/api", (req, res) => res.status(404).json({ ok: false, error: "Not found" }));

// Clean URLs like /about or /portfolio still open the site (the browser router reads the hash).
app.get(/^\/[^.]*$/, (req, res) => res.sendFile(INDEX));

// Anything else (a missing image, script or stylesheet) is a real 404.
app.use((req, res) => res.status(404).type("text/plain").send("Not found"));

app.listen(PORT, HOST, () => {
  console.log(`Portfolio running at http://localhost:${PORT} (${isProd ? "production" : "development"})`);
  console.log(contact.describeSetup());
  contact.verifyConnection();
});
