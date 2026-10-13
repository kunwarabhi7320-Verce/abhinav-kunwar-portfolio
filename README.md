# Abhinav Kunwar — Portfolio

AI video editor and motion graphics designer portfolio, served by a small Node.js (Express) server.

## Requirements

- Node.js 22.12 or newer (tested on Node 22)

## Run it

```bash
npm install        # first time only
npm run dev        # development: http://localhost:3000, restarts when server.js changes
npm start          # run normally
npm run prod       # production mode: images and scripts are cached by the browser
npm run build      # static copy of the site in dist/ (used by GitHub Pages)

npm run studio:install   # first time only: installs Sanity Studio (in studio/)
npm run studio           # Sanity Studio (the CMS): http://localhost:3333
npm run studio:deploy    # publish the Studio to https://<name>.sanity.studio
```

Use a different port with `PORT=8080 npm start` (on Windows PowerShell: `$env:PORT=8080; npm start`).

## Project structure

```
server.js              Express server: serves /public, contact API, clean URLs, 404s for missing files
lib/contact.js         POST /api/contact: validation, spam checks, sends the inquiry email (Nodemailer)
lib/sanity.js          GET /api/projects (published projects from Sanity, cached) + /js/cms-config.js
lib/projects-query.js  the GROQ query for projects (shared by the server and the static build)
.env.example           settings template (Sanity, email) — copy to .env
studio/                Sanity Studio: the CMS where you add and publish projects (separate app)
render.yaml            Render deployment settings (full site + contact form)
scripts/build.js       static build for GitHub Pages: checks paths, copies public/ to dist/
.github/workflows/     GitHub Actions workflow that publishes to GitHub Pages
package.json           scripts and dependencies (Express, Nodemailer, dotenv)
public/
  index.html           page shell: header, footer, overlays
  css/styles.css       all styles: layout, colours, gradients, hover effects, animations
  js/data.js           content: contact details, photos, projects, experience, testimonials, tools
  js/cms-config.js     CMS switch for static hosting (the server and the build replace it)
  js/cms.js            loads published projects from Sanity into the existing cards
  js/video-modal.js    Wistia player pop-up (accessible, lazy-loaded)
  js/app.js            rendering, page routing, transitions, particles, contact form
  img/                 portraits (transparent WebP)
  favicon.svg          browser-tab icon
```

## Portfolio CMS (Sanity + Wistia)

Projects are managed in **Sanity Studio** and their videos are hosted on **Wistia**. Publishing a project in the Studio puts it in the right gallery automatically — no code change and no redeploy.

### How it works

- The Studio (`studio/`) is a separate app for you only. Visitors never see it.
- The website reads **published** projects only, with no token: a draft, or unpublished changes to a published project, never appear on the site.
- On Render, the server fetches projects from Sanity (`/api/projects`) and keeps a copy for `SANITY_CACHE_SECONDS` (60 s by default). The GitHub Pages copy reads Sanity's public API directly from the browser.
- Each visitor's browser remembers the last list, so repeat visits show projects instantly and then refresh them.
- **Until you publish your first project**, the site keeps showing the projects in `public/js/data.js`. If Sanity can't be reached, the site shows the last list it saw (or the data.js projects) instead of an error.
- Cards with a Wistia video open a player pop-up. It loads Wistia's player only when opened, never autoplays, supports 9:16 and 16:9, closes with ✕, Esc or a click outside the video, and returns focus and scroll position to where you were.

**How long until a change shows:** usually within a minute after **Publish** (the server's 60-second copy, plus Sanity's CDN, which updates within seconds). A visitor who already has the page open sees it after reloading.

### 1 · Create the Sanity project (once)

1. Go to https://www.sanity.io and sign up (Google or GitHub login is fine). Free plan is enough.
2. Open https://www.sanity.io/manage → **Create new project** → name it "Abhinav Kunwar Portfolio". When asked, create a dataset named **production** with **Public** visibility. (Public = anyone can *read published* content, which is what the website needs. Nobody can edit without logging in to your Sanity account.)
3. On the project page, copy the **Project ID** (8 characters, shown at the top).
4. Still in manage → **API** → **CORS origins** → **Add CORS origin**, add each address that reads content in the browser (no "Allow credentials" needed):
   - `https://kunwarabhi7320-verce.github.io` (GitHub Pages copy)
   - `http://localhost:3000` (only if you test the static build locally)
   The Studio's own addresses (`http://localhost:3333` and `https://<name>.sanity.studio`) are added automatically the first time you run or deploy it; if the Studio says "CORS origin not allowed", add `http://localhost:3333` here with **Allow credentials** ticked.

### 2 · Run the Studio on your computer

```bash
cp studio/.env.example studio/.env      # then paste your Project ID into studio/.env
npm run studio:install
npm run studio                            # opens http://localhost:3333 — log in with the same Sanity account
```

To get a permanent online address for the Studio (e.g. `https://abhinav-kunwar-portfolio.sanity.studio`):

```bash
npm run studio:deploy
```

### 3 · Connect the website

- **Locally:** put `SANITY_PROJECT_ID=<your id>` in `.env` and run `npm run dev`. The console shows `Sanity CMS: reading published projects from …`.
- **Render:** service → **Environment** → add `SANITY_PROJECT_ID` = your Project ID → **Save, rebuild and deploy**. (`SANITY_DATASET`, `SANITY_API_VERSION` and `SANITY_CACHE_SECONDS` come from `render.yaml`.)
- **GitHub Pages:** repository → **Settings → Secrets and variables → Actions → Variables** → add `SANITY_PROJECT_ID` (and optionally `SANITY_DATASET`, `SANITY_API_VERSION`) → re-run the "Deploy to GitHub Pages" workflow. Remember the CORS origin from step 1.

These IDs are public identifiers, not passwords. **Never** create a Sanity API token for the website and never put one in this repository — the site doesn't need one.

### 4 · Add a video project

1. **Wistia:** upload the video at https://wistia.com. Open it; the page address ends in `/medias/abc123def4` — `abc123def4` is the **media ID**. (Or Share → Embed: the code contains `media-id="abc123def4"`.) In Wistia's Customize panel keep **Autoplay off**.
2. **Studio:** click **+** (or **Create** in any list) → **Project**.
3. *Basics:* title, click **Generate** for the URL slug, short description, choose **AI Video Projects** or **Motion Graphics Video Projects**, then **Short Form (9:16)** or **Long Form (16:9)**. Client and tags are optional.
4. *Video:* paste the **Wistia media ID**. Optionally paste the Wistia link (it is checked against the ID). Upload a **thumbnail** (9:16 for short form, 16:9 for long form), drag the hotspot circle onto the subject, and add alt text.
5. *Display:* **Display order** (1 = first) and **Featured** (the first three featured projects appear on the home page).
6. Fix anything the Studio underlines in red, then click **Publish**. To hide a project later, open it → **⋯** → **Unpublish** (it stays as a draft) or **Delete**.

### Editing content in code

Everything that isn't a CMS project lives in `public/js/data.js`:

- **Projects without the CMS:** while no project is published in Sanity, the gallery uses `PROJECTS` here.
- **Add a project:** add an entry to `PROJECTS`. `category` is `"ai-video"` or `"motion-graphics"`, `format` is `"short-form"` or `"long-form"`, `orientation` is `"portrait"` (9:16) or `"landscape"` (16:9). The project appears in the right gallery automatically.
- **Add a video:** put an `.mp4`/`.webm` file in `public/` (for example `public/videos/frnd-ad-01.mp4`) and set `video: "videos/frnd-ad-01.mp4"`. It plays on the project page and previews on card hover. A YouTube, Vimeo or Google Drive link also works; it opens in a new tab.
- **Thumbnails:** put the image in `public/img/` and set `thumbnail: "img/your-file.webp"`.
- **Contact details, LinkedIn, showreel:** edit `CONFIG`.
- **Experience and testimonials:** edit `EXPERIENCE` and `TESTIMONIALS`.

After editing, refresh the browser. Changes to files in `public/` show without restarting the server.

## Animations

- **Text entrances** (`public/js/app.js`, search "Text entrances"): labels fade in first, major headings rise line by line inside a mask, then paragraphs, then buttons. Each plays once when it scrolls into view and is removed when finished, so the page settles back to its exact static design.
- Which blocks animate is listed in `RV_GROUPS` and `RV_SOLO`; timing lives in `RV_STEP`, `RV_LINE` and `RV_WORD`.
- Visitors who turn on "reduce motion" in their system settings see the site with no entrance animations. Without JavaScript everything simply shows.
- Pattern canvases only animate while they are on screen.

## Pages

Navigation happens in the browser through the address hash:

| Page | URL |
| --- | --- |
| Home | `/` or `/#home` |
| Portfolio | `/#portfolio` |
| AI Video Projects | `/#ai`, `/#ai-short`, `/#ai-long` |
| Motion Graphics Video Projects | `/#motion`, `/#motion-short`, `/#motion-long` |
| A project | `/#work.<project-id>` |
| About | `/#about` |
| Contact | `/#contact` |

## Contact page

- **Email Me** — the inquiry form. Pressing **Send** posts it to the server (`POST /api/contact`), which emails it to `kunwarabhi7320@gmail.com` with the subject `New Portfolio Inquiry — <Project Type>`. Hitting *Reply* in Gmail answers the client directly.
- **Book a Call** — opens https://calendly.com/kunwarabhi7320/30min in a new tab (change it in `CONFIG.calendly`).

### How the form sends (Web3Forms — recommended)

When `CONFIG.web3formsKey` in `public/js/data.js` is set, **Send** delivers the inquiry straight to `kunwarabhi7320@gmail.com` through [Web3Forms](https://web3forms.com) (free), with the subject `New Portfolio Inquiry — <Project Type>` and every field: client name, email, project type, budget and message. Reply in Gmail answers the client. It works on every host — GitHub Pages and Render's free plan included — because the browser sends it, not the server.

To get or replace the key: open https://web3forms.com, enter `kunwarabhi7320@gmail.com` under *Create your Access Key*, and paste the key from the email into `web3formsKey`. The key only lets people send messages *to* you, so it is safe in public code.

Render's free plan blocks outgoing email ports (25, 465, 587), so the Gmail App Password route below only works on a paid Render instance or another host that allows SMTP. If `web3formsKey` is empty, the form uses that server route.

### Email setup via Gmail App Password (server route)

The form sends through your Gmail account using a **Google App Password**, not your normal password.

1. Turn on 2-Step Verification for the Gmail account: https://myaccount.google.com/security
2. Create an App Password at https://myaccount.google.com/apppasswords (name it "Portfolio"). Google shows a 16-character code.
3. In the project folder, copy `.env.example` to `.env` and fill in:
   ```
   SMTP_USER=kunwarabhi7320@gmail.com
   SMTP_PASS=the16charactercode
   MAIL_TO=kunwarabhi7320@gmail.com
   ```
   Spaces in the App Password are fine.
4. Restart the server. The console should print `Contact email: SMTP login verified`.

`.env` is listed in `.gitignore` — never commit it. On a hosting provider, add the same variables in its environment-variable settings instead of uploading `.env` (and set `TRUST_PROXY=1`).

Until these are set, the form shows visitors an honest "Email sending isn't set up yet" message with your address; it never claims a message was sent when it wasn't.

### Protection built in

- Validation in the browser and again on the server (required fields, valid email, allowed project types and budgets, length limits).
- Hidden honeypot field and a minimum fill time to stop simple bots.
- Rate limit: 5 messages per visitor IP per 10 minutes.
- Requests from other websites and non-JSON requests are rejected.
- Credentials stay on the server; logs record only error codes, never passwords or visitor details.

## Deploying

The code lives on GitHub. Two copies of the site are built from it automatically on every push to `main`:

| Where | What works | Set up by |
| --- | --- | --- |
| **Render** (Node server) | Everything, including the contact form sending email | `render.yaml` |
| **GitHub Pages** (static) | Every page, image, animation, CMS project and Wistia video; the contact form sends through Web3Forms | `.github/workflows/deploy-pages.yml` |
| **Sanity Studio** (CMS) | Where you manage projects — `npm run studio:deploy` publishes it to `*.sanity.studio` | `studio/` |

Use the Render address as your main link once it is set up.

### Render (full site with working contact form)

1. Create the Gmail App Password (see *Email setup* above).
2. Sign in at https://render.com with your GitHub account.
3. **New → Blueprint**, choose this repository, and paste the App Password into `SMTP_PASS` when asked. Your Gmail address (`SMTP_USER`) is already filled in.
4. Wait for the deploy to finish; the site is at `https://abhinav-kunwar-portfolio.onrender.com` (Render shows the exact address).

`render.yaml` already sets these, so you only type the App Password:

| Setting | Value |
| --- | --- |
| Build command | `npm ci` |
| Start command | `npm start` |
| Node version | 22 (`NODE_VERSION`) |
| `NODE_ENV` | `production` |
| `TRUST_PROXY` | `1` |
| `MAIL_TO` | `kunwarabhi7320@gmail.com` |
| `SMTP_USER` | `kunwarabhi7320@gmail.com` |
| `SMTP_PASS` | only if you use the SMTP route (paid Render plan) |
| `SANITY_PROJECT_ID` | your Sanity Project ID (you enter it under Environment) |
| `SANITY_DATASET` / `SANITY_API_VERSION` / `SANITY_CACHE_SECONDS` | `production` / `2025-02-19` / `60` |

Without a Blueprint, create a **Web Service** from the repository and enter the same values by hand. Any other Node host (Railway, Fly.io, a VPS) works with the same settings. Render's free plan sleeps after a period without visitors, so the first visit afterwards takes up to a minute to load.

### GitHub Pages (static copy)

Settings → Pages → Source is set to **GitHub Actions**. Each push runs `npm run build`, which copies `public/` to `dist/`, stops with an error if an image, script or video path is broken, and adds a `404.html` that sends unknown URLs back to the home page. The site is at `https://<username>.github.io/abhinav-kunwar-portfolio/`.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `SANITY_PROJECT_ID` | for the CMS | Sanity project ID; empty = use the projects in `data.js` |
| `SANITY_DATASET` | no | Dataset name (default `production`) |
| `SANITY_API_VERSION` | no | Sanity API date (default `2025-02-19`) |
| `SANITY_CACHE_SECONDS` | no | How long the server keeps the project list (default `60`) |
| `SMTP_USER` | for the form | Gmail address that sends the inquiry emails |
| `SMTP_PASS` | for the form | Google App Password (not your normal password) |
| `MAIL_TO` | no | Where inquiries go (default `kunwarabhi7320@gmail.com`) |
| `TRUST_PROXY` | on hosts | `1` behind Render/Railway/Fly so rate limiting sees real visitor IPs |
| `NODE_ENV` | no | `production` turns on browser caching |
| `PORT` / `HOST` | no | Set by the host; defaults `3000` / `0.0.0.0` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `MAIL_FROM` | no | Only for a mail provider other than Gmail |

Never commit `.env` or put the App Password in any file in this repository; `.gitignore` excludes `.env`.

### Large videos

GitHub rejects files over 100 MB. Put long or heavy videos on YouTube, Vimeo or Google Drive and paste the link into `video:` in `public/js/data.js`.
