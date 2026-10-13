import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // Hosted Studio address: https://<studioHost>.sanity.studio (chosen on first `npm run deploy` if empty).
  studioHost: process.env.SANITY_STUDIO_HOSTNAME || undefined,
  deployment: {autoUpdates: true},
})
