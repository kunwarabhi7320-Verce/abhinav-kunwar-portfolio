import {defineField, defineType} from 'sanity'
import {PlayIcon} from '@sanity/icons/Play'

/* Must match the website (public/js/data.js → CATS / KEY_TO_SLUG). */
export const CATEGORIES = [
  {title: 'AI Video Projects', value: 'ai-video'},
  {title: 'Motion Graphics Video Projects', value: 'motion-graphics'},
]
export const FORMATS = [
  {title: 'Short Form · vertical 9:16', value: 'short-form'},
  {title: 'Long Form · horizontal 16:9', value: 'long-form'},
]
const label = (list, value) => list.find((o) => o.value === value)?.title

/* Wistia media IDs ("hashed IDs") are short lowercase letter/number codes, e.g. "abc123def4". */
const WISTIA_ID = /^[a-z0-9]+$/
const idFromWistiaUrl = (url) => (String(url || '').match(/\/(?:medias|m|embed\/iframe|embed\/medias)\/([a-z0-9]+)/i) || [])[1]

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  icon: PlayIcon,
  groups: [
    {name: 'basics', title: '1 · Basics', default: true},
    {name: 'video', title: '2 · Video'},
    {name: 'display', title: '3 · Display'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Project title',
      type: 'string',
      group: 'basics',
      description: 'Shown on the project card and in the video player. Example: "PlayChat AI Ad Campaign".',
      validation: (rule) => rule.required().min(3).max(90),
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      group: 'basics',
      description: 'The project’s web address, e.g. yoursite.com/#work.playchat-ai-ad. Click "Generate" after typing the title.',
      options: {source: 'title', maxLength: 80},
      validation: (rule) =>
        rule.required().custom((slug) =>
          !slug?.current || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.current)
            ? true
            : 'Use lowercase letters, numbers and single dashes only (e.g. playchat-ai-ad).',
        ),
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short description',
      type: 'text',
      rows: 3,
      group: 'basics',
      description: 'One or two sentences shown on the card. Aim for under 160 characters.',
      validation: (rule) => [
        rule.required().min(10),
        rule.max(240).error('Keep it under 240 characters so the card stays tidy.'),
        rule.max(160).warning('Over 160 characters may be cut short on small cards.'),
      ],
    }),
    defineField({
      name: 'category',
      title: 'Project category',
      type: 'string',
      group: 'basics',
      description: 'Which gallery this project appears in.',
      options: {list: CATEGORIES, layout: 'radio'},
      validation: (rule) => rule.required().error('Choose AI Video Projects or Motion Graphics Video Projects.'),
    }),
    defineField({
      name: 'format',
      title: 'Video format',
      type: 'string',
      group: 'basics',
      description: 'Short Form = vertical 9:16 (Reels, TikTok, Shorts). Long Form = horizontal 16:9 (YouTube, films).',
      options: {list: FORMATS, layout: 'radio'},
      validation: (rule) => rule.required().error('Choose Short Form or Long Form.'),
    }),
    defineField({
      name: 'clientName',
      title: 'Client name (optional)',
      type: 'string',
      group: 'basics',
      description: 'Shown under "Context" on the project page. Leave empty for personal work.',
      validation: (rule) => rule.max(80),
    }),
    defineField({
      name: 'tags',
      title: 'Tags (optional)',
      type: 'array',
      group: 'basics',
      description: 'Short labels shown on the card, e.g. "UGC", "Product ad". Type a tag and press Enter.',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
      validation: (rule) => rule.max(6).unique(),
    }),

    defineField({
      name: 'wistiaId',
      title: 'Wistia media ID',
      type: 'string',
      group: 'video',
      description:
        'In Wistia, open the video: the ID is the code at the end of the page address (wistia.com/medias/abc123def4 → abc123def4). Paste only the code.',
      validation: (rule) =>
        rule.required().custom((value) => {
          if (!value) return true
          const v = value.trim()
          if (v !== value) return 'Remove the spaces before or after the ID.'
          if (/wistia|\/|\./i.test(v)) return 'Paste only the ID code, not the whole link (e.g. abc123def4).'
          if (!WISTIA_ID.test(v)) return 'Wistia IDs use only lowercase letters and numbers.'
          return true
        }).custom((value) =>
          value && value.length !== 10
            ? {message: 'Most Wistia media IDs are 10 characters long. Double-check it was copied fully.', level: 'warning'}
            : true,
        ),
    }),
    defineField({
      name: 'wistiaUrl',
      title: 'Wistia video link (optional)',
      type: 'url',
      group: 'video',
      description: 'For your reference only. If filled, it is checked against the media ID above.',
      validation: (rule) =>
        rule.uri({scheme: ['https']}).custom((url, ctx) => {
          if (!url) return true
          if (!/wistia\.(com|net)|wi\.st/i.test(url)) return {message: 'This does not look like a Wistia link.', level: 'warning'}
          const id = idFromWistiaUrl(url)
          if (id && ctx.document?.wistiaId && id !== ctx.document.wistiaId)
            return `This link is for media "${id}", but the media ID above is "${ctx.document.wistiaId}".`
          return true
        }),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail image',
      type: 'image',
      group: 'video',
      description: 'Cover image for the card and the player. Use a 9:16 image for Short Form, 16:9 for Long Form. JPG/PNG/WebP.',
      options: {hotspot: true, accept: 'image/jpeg,image/png,image/webp'},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text (optional)',
          type: 'string',
          description: 'Describe the image for people using screen readers, e.g. "Woman holding a skincare bottle in a bathroom".',
          validation: (rule) => rule.max(140),
        }),
      ],
      validation: (rule) =>
        rule.custom((img) =>
          img?.asset ? true : {message: 'Without a thumbnail the card shows the designed placeholder poster.', level: 'warning'},
        ),
    }),

    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      group: 'display',
      description: 'Lower numbers appear first in a gallery (1 = first). Projects with the same number show newest first.',
      initialValue: 100,
      validation: (rule) => rule.required().integer().min(0).max(9999),
    }),
    defineField({
      name: 'featured',
      title: 'Featured project',
      type: 'boolean',
      group: 'display',
      description: 'Turn on to show this project in "Few Projects" on the home page (the first 3 featured, by display order).',
      initialValue: false,
    }),
  ],

  orderings: [
    {title: 'Display order', name: 'displayOrder', by: [{field: 'order', direction: 'asc'}, {field: '_createdAt', direction: 'desc'}]},
    {title: 'Recently updated', name: 'updatedDesc', by: [{field: '_updatedAt', direction: 'desc'}]},
    {title: 'Newest first', name: 'createdDesc', by: [{field: '_createdAt', direction: 'desc'}]},
  ],

  preview: {
    select: {title: 'title', category: 'category', format: 'format', featured: 'featured', order: 'order', media: 'thumbnail'},
    prepare({title, category, format, featured, order, media}) {
      const parts = [label(CATEGORIES, category) || 'No category', (label(FORMATS, format) || 'No format').split(' ·')[0]]
      if (typeof order === 'number') parts.push(`#${order}`)
      if (featured) parts.push('★ Featured')
      return {title: title || 'Untitled project', subtitle: parts.join(' · '), media: media || PlayIcon}
    },
  },
})
