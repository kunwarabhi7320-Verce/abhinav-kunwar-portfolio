import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // The portfolio server hosts the built Studio at /studio.
  project: {basePath: '/studio'},
  // Hosted Studio address: https://<studioHost>.sanity.studio (chosen on first `npm run deploy` if empty).
  studioHost: process.env.SANITY_STUDIO_HOSTNAME || undefined,
  // Self-contained builds: the Studio only changes when this repository does.
  deployment: {autoUpdates: false},
})
