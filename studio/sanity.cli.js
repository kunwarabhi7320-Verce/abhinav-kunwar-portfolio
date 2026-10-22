import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // The Studio lives at /studio on the website (Render server and GitHub Pages / abhinavkunwar.me).
  // scripts/build-studio.js sets SANITY_STUDIO_BASEPATH when the site sits in a sub-folder.
  project: {basePath: process.env.SANITY_STUDIO_BASEPATH || '/studio'},
  // Hosted Studio address: https://<studioHost>.sanity.studio (chosen on first `npm run deploy` if empty).
  studioHost: process.env.SANITY_STUDIO_HOSTNAME || undefined,
  // Self-contained builds: the Studio only changes when this repository does.
  deployment: {autoUpdates: false},
})
