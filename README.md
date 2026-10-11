# Abhinav Kunwar — Portfolio

AI video editor and motion graphics designer portfolio, served by a small Node.js (Express) server.

## Requirements

- Node.js 20 or newer (tested on Node 22)

## Run it

```bash
npm install        # first time only
npm run dev        # development: http://localhost:3000, restarts when server.js changes
npm start          # run normally
npm run prod       # production mode: images and scripts are cached by the browser
npm run build      # static copy of the site in dist/ (used by GitHub Pages)
```

Use a different port with `PORT=8080 npm start` (on Windows PowerShell: `$env:PORT=8080; npm start`).

## Project structure

```
server.js              Express server: serves /public, contact API, clean URLs, 404s for missing files
lib/contact.js         POST /api/contact: validation, spam checks, sends the inquiry email (Nodemailer)
.env.example           email settings template — copy to .env
render.yaml            Render deployment settings (full site + contact form)
scripts/build.js       static build for GitHub Pages: checks paths, copies public/ to dist/
.github/workflows/     GitHub Actions workflow that publishes to GitHub Pages
package.json           scripts and dependencies (Express, Nodemailer, dotenv)
public/
  index.html           page shell: header, footer, overlays
  css/styles.css       all styles: layout, colours, gradients, hover effects, animations
  js/data.js           content: contact details, photos, projects, experience, testimonials, tools
  js/app.js            rendering, page routing, transitions, particles, contact form
  img/                 portraits (transparent WebP)
  favicon.svg          browser-tab icon
```

## Editing content

Almost everything you will change lives in `public/js/data.js`:

- **Add a project:** add an entry to `PROJECTS`. `category` is `"ai-video"` or `"motion-graphics"`, `format` is `"short-form"` or `"long-form"`, `orientation` is `"portrait"` (9:16) or `"landscape"` (16:9). The project appears in the right gallery automatically.
- **Add a video:** put an `.mp4`/`.webm` file in `public/` (for example `public/videos/frnd-ad-01.mp4`) and set `video: "videos/frnd-ad-01.mp4"`. It plays on the project page and previews on card hover. A YouTube, Vimeo or Google Drive link also works; it opens in a new tab.
- **Thumbnails:** put the image in `public/img/` and set `thumbnail: "img/your-file.webp"`.
- **Contact details, LinkedIn, showreel:** edit `CONFIG`.
- **Experience and testimonials:** edit `EXPERIENCE` and `TESTIMONIALS`.

After editing, refresh the browser. Changes to files in `public/` show without restarting the server.

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
| **GitHub Pages** (static) | Every page, image and animation. The form can't send here, so it offers visitors a pre-filled email instead | `.github/workflows/deploy-pages.yml` |

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
| `SMTP_PASS` | your 16-character App Password (you enter it) |

Without a Blueprint, create a **Web Service** from the repository and enter the same values by hand. Any other Node host (Railway, Fly.io, a VPS) works with the same settings. Render's free plan sleeps after a period without visitors, so the first visit afterwards takes up to a minute to load.

### GitHub Pages (static copy)

Settings → Pages → Source is set to **GitHub Actions**. Each push runs `npm run build`, which copies `public/` to `dist/`, stops with an error if an image, script or video path is broken, and adds a `404.html` that sends unknown URLs back to the home page. The site is at `https://<username>.github.io/abhinav-kunwar-portfolio/`.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
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
