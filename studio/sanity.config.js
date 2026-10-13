/**
 * Sanity Studio for Abhinav Kunwar's portfolio.
 * Project ID and dataset come from studio/.env (see studio/.env.example), never hard-coded.
 */
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

if (!projectId) {
  throw new Error(
    'Missing SANITY_STUDIO_PROJECT_ID. Copy studio/.env.example to studio/.env and paste your Sanity project ID (sanity.io/manage → your project).',
  )
}

export default defineConfig({
  name: 'default',
  title: 'Abhinav Kunwar · Portfolio CMS',
  // The /studio base path is set once, in sanity.cli.js (project.basePath), for both dev and build.
  projectId,
  dataset,
  plugins: [
    structureTool({structure, title: 'Portfolio'}),
    // GROQ playground for checking queries; only people logged in to your Sanity project can use it.
    visionTool({defaultApiVersion: process.env.SANITY_STUDIO_API_VERSION || '2025-02-19'}),
  ],
  schema: {
    types: schemaTypes,
    // "Create" menu: only offer Project (keeps the menu simple).
    templates: (prev) => prev.filter((t) => t.schemaType === 'project'),
  },
  document: {
    // Hide "Duplicate" confusion-free; keep Publish/Unpublish/Discard/Delete (Sanity's standard workflow).
    newDocumentOptions: (prev) => prev.filter((item) => item.templateId === 'project'),
  },
})
