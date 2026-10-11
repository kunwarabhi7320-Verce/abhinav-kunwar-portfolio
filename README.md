# Abhinav Kunwar — Portfolio

AI video editor and motion graphics designer portfolio, served by a small Node.js (Express) server.

## Requirements

- Node.js 18.11 or newer (tested on Node 22)

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
server.js              Express server: serves /public, clean URLs, 404s for missing files
package.json           scripts and dependencies (Express only)
scripts/build.js       static build for GitHub Pages: checks paths, copies public/ to dist/
.github/workflows/     GitHub Actions workflow that publishes to GitHub Pages
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

## Contact form

The form currently prepares a ready-to-send email brief for the visitor; nothing is sent from the site. To deliver briefs straight to your inbox, set `CONFIG.formEndpoint` in `public/js/data.js` to a form-service URL (for example Formspree) that accepts JSON.

## Deploying

The website itself is fully static (HTML, CSS, JavaScript and images in `public/`). Express only serves those files, so the site needs no backend and can be hosted either way below.

### GitHub Pages (free, no server)

Already set up in `.github/workflows/deploy-pages.yml`.

1. Push this project to a GitHub repository (branch `main`).
2. In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Open the **Actions** tab and wait for "Deploy to GitHub Pages" to turn green (re-run it once if it started before step 2).
4. The site is live at `https://<your-username>.github.io/<repository-name>/`.

Every later push to `main` redeploys automatically. On the free plan the repository must be public for Pages to work.

`npm run build` copies `public/` into `dist/`, stops with an error if any image, script or video path is missing, and adds a `404.html` that sends unknown URLs back to the home page. You can run it locally to check before pushing.

### Node host (Render, Railway, Fly.io, a VPS)

Connect the GitHub repository and use:

| Setting | Value |
| --- | --- |
| Build command | `npm ci` |
| Start command | `npm start` |
| Node version | 18.11 or newer (22 recommended) |
| Environment variable | `NODE_ENV=production` (turns on browser caching for images, CSS and JS) |

The server listens on the `PORT` the host provides and on `0.0.0.0`. Nothing else needs to be configured.

### Environment variables

None are required. All are optional:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port for the Express server (hosts set this for you) |
| `HOST` | `0.0.0.0` | Network address the server listens on |
| `NODE_ENV` | — | `production` enables caching headers |
| `BASE_PATH` | `""` | Build only: sub-folder the static site lives in (set automatically by the GitHub Pages workflow) |

The site has no API keys or secrets. Never commit a `.env` file; `.gitignore` already excludes it.

### Large videos

GitHub rejects files over 100 MB, and a GitHub Pages site should stay under 1 GB. For long or heavy videos, upload them to YouTube, Vimeo or Google Drive and paste the link into `video:` in `public/js/data.js`.
