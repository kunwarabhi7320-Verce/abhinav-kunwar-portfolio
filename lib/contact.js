"use strict";

/**
 * POST /api/contact — validates a project inquiry and emails it to Abhinav.
 *
 * Credentials come only from environment variables (see .env.example) and are
 * never sent to the browser or written to the logs.
 */
const express = require("express");
const nodemailer = require("nodemailer");

const MAIL_TO = process.env.MAIL_TO || "kunwarabhi7320@gmail.com";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = (process.env.SMTP_PASS || "").replace(/\s+/g, ""); // Google shows App Passwords with spaces
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_SECURE = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : SMTP_PORT === 465;
const MAIL_FROM = process.env.MAIL_FROM || (SMTP_USER ? `"Portfolio Inquiry" <${SMTP_USER}>` : "");

// Must match the options in the contact form.
const PROJECT_TYPES = ["AI Video Production", "Motion Graphics", "Short-Form Editing", "Long-Form Editing", "DTC / UGC Ads", "Real Estate Videos", "Other"];
const BUDGETS = ["Not sure yet", "Under $250", "$250 – $750", "$750 – $2,000", "$2,000+"];

const EMAIL_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]{2,}$/;
const MIN_FILL_MS = 2500;            // a person takes longer than this to fill the form
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;                  // submissions per IP per window

const configured = Boolean(SMTP_USER && SMTP_PASS);
const transporter = configured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })
  : null;

function describeSetup() {
  if (!configured) return "Contact email: NOT configured (set SMTP_USER and SMTP_PASS in .env)";
  return `Contact email: sending to ${MAIL_TO} via ${SMTP_HOST}:${SMTP_PORT}`;
}

async function verifyConnection() {
  if (!transporter) return;
  try {
    await transporter.verify();
    console.log("Contact email: SMTP login verified");
  } catch (err) {
    console.warn(`Contact email: SMTP check failed (${err.code || err.responseCode || "error"}). Check SMTP_USER / SMTP_PASS.`);
  }
}

/* ---------- validation ---------- */
const clean = (v, max) => String(v ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max + 1);
const oneLine = v => v.replace(/[\r\n\t]+/g, " ").trim();

function validate(body) {
  const errors = {};
  const data = {
    name: oneLine(clean(body.name, 100)),
    email: oneLine(clean(body.email, 254)),
    type: oneLine(clean(body.type, 60)),
    budget: oneLine(clean(body.budget, 60)),
    message: clean(body.message, 5000),
  };
  if (!data.name) errors.name = "Add your name.";
  else if (data.name.length > 100) errors.name = "Keep your name under 100 characters.";
  if (!EMAIL_RE.test(data.email) || data.email.length > 254) errors.email = "Add an email address I can reply to.";
  if (!PROJECT_TYPES.includes(data.type)) errors.type = "Choose a project type.";
  if (!BUDGETS.includes(data.budget)) errors.budget = "Choose a budget range.";
  if (data.message.length < 10) errors.message = "Describe the project in a sentence or two.";
  else if (data.message.length > 5000) errors.message = "Keep the message under 5,000 characters.";
  return { data, errors };
}

/* ---------- email content ---------- */
const escHtml = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function buildEmail(d) {
  const subject = `New Portfolio Inquiry — ${d.type}`;
  const text = [
    "New project inquiry received through your portfolio.",
    "",
    `Client Name: ${d.name}`,
    "",
    `Client Email: ${d.email}`,
    "",
    `Project Type: ${d.type}`,
    "",
    `Budget Range: ${d.budget}`,
    "",
    "Project Message:",
    d.message,
    "",
    "Received From: Abhinav Kunwar's Portfolio",
  ].join("\n");

  const row = (label, value) =>
    `<tr><td style="padding:8px 16px 8px 0;color:#6b7080;font-size:13px;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:8px 0;color:#111;font-size:15px">${value}</td></tr>`;
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f4f5f8;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;border-top:4px solid #2fd8ff">
<tr><td style="padding:24px 28px">
<p style="margin:0 0 18px;font-size:16px;color:#111;font-weight:bold">New project inquiry received through your portfolio.</p>
<table role="presentation" style="border-collapse:collapse;width:100%">
${row("Client Name", escHtml(d.name))}
${row("Client Email", `<a href="mailto:${escHtml(d.email)}" style="color:#1e4bff">${escHtml(d.email)}</a>`)}
${row("Project Type", escHtml(d.type))}
${row("Budget Range", escHtml(d.budget))}
</table>
<p style="margin:20px 0 6px;color:#6b7080;font-size:13px">Project Message:</p>
<div style="padding:14px 16px;background:#f7f8fb;border-left:3px solid #ff3fb4;border-radius:4px;color:#111;font-size:15px;line-height:1.55;white-space:pre-wrap">${escHtml(d.message)}</div>
<p style="margin:22px 0 0;color:#6b7080;font-size:12px">Received From: Abhinav Kunwar's Portfolio</p>
</td></tr></table></body></html>`;
  return { subject, text, html };
}

/* ---------- abuse protection ---------- */
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (list.length >= RATE_MAX) { hits.set(ip, list); return true; }
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < RATE_WINDOW_MS)) hits.delete(k);
  return false;
}
function sameOrigin(req) {
  const origin = req.get("origin");
  if (!origin) return true; // same-origin fetches from some browsers omit it
  try { return new URL(origin).host === req.get("host"); } catch { return false; }
}

/* ---------- route ---------- */
const router = express.Router();
router.post("/api/contact", express.json({ limit: "16kb" }), async (req, res) => {
  if (!req.is("application/json")) return res.status(415).json({ ok: false, error: "Send the form as JSON." });
  if (!sameOrigin(req)) return res.status(403).json({ ok: false, error: "This form can only be sent from the portfolio site." });

  const body = req.body || {};
  // Honeypot: a hidden field people never see. Bots fill it; pretend success and drop it.
  if (body.website) return res.json({ ok: true });
  const started = Number(body.startedAt);
  if (!started || Date.now() - started < MIN_FILL_MS) {
    return res.status(400).json({ ok: false, error: "That was a little fast. Please wait a moment and press Send again." });
  }
  if (rateLimited(req.ip)) {
    return res.status(429).json({ ok: false, error: "Too many messages in a short time. Please try again in a few minutes." });
  }

  const { data, errors } = validate(body);
  if (Object.keys(errors).length) return res.status(400).json({ ok: false, error: "Please check the highlighted fields.", fields: errors });

  if (!transporter) {
    return res.status(503).json({ ok: false, error: `Email sending isn't set up yet. Please email ${MAIL_TO} directly.` });
  }

  const { subject, text, html } = buildEmail(data);
  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to: MAIL_TO,
      replyTo: { name: data.name, address: data.email },
      subject,
      text,
      html,
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error(`Contact email failed: ${err.code || err.responseCode || "error"}`);
    return res.status(502).json({ ok: false, error: "Your message couldn't be sent right now. Please try again in a moment." });
  }
});

module.exports = { router, describeSetup, verifyConnection, PROJECT_TYPES, BUDGETS };
