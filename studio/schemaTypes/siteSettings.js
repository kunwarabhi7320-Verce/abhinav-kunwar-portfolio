import {defineArrayMember, defineField, defineType} from 'sanity'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {siteDefaults} from './siteDefaults'

/*
 * "Website text": one document that holds the words on the website (home, about, contact…).
 * It opens already filled in with today's text (siteDefaults, generated from public/js/data.js).
 * Change a field, press Publish, and the site shows it within about a minute.
 * A field left empty keeps the original text, so nothing on the site can go blank by mistake.
 */

const COLORS = [
  {title: 'AI (blue)', value: 'ai'},
  {title: 'Motion (orange)', value: 'mg'},
  {title: 'Plain', value: 'neutral'},
]
const EMPTY_KEEPS = 'Leave empty to keep the original text.'

const line = (name, title, group, description, max = 160) =>
  defineField({name, title, type: 'string', group, description: description || EMPTY_KEEPS, validation: (r) => r.max(max)})
const para = (name, title, group, description, rows = 3) =>
  defineField({name, title, type: 'text', rows, group, description: description || EMPTY_KEEPS, validation: (r) => r.max(900)})

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Website text',
  type: 'document',
  icon: DocumentTextIcon,
  initialValue: siteDefaults,
  groups: [
    {name: 'home', title: 'Home', default: true},
    {name: 'about', title: 'About'},
    {name: 'experience', title: 'Experience'},
    {name: 'testimonials', title: 'Testimonials'},
    {name: 'skills', title: 'Skills & workflow'},
    {name: 'contact', title: 'Contact details'},
    {name: 'galleries', title: 'Gallery pages'},
  ],
  fields: [
    // ---------- Home ----------
    line('heroRole', 'Hero: your title', 'home', 'Small line above the big heading, e.g. "AI Video Editor & Motion Graphics Designer". Your city is added after it automatically.'),
    line('heroHeading', 'Hero: big heading', 'home', 'The last two words are coloured blue and orange automatically.', 80),
    para('heroLead', 'Hero: line under the heading', 'home'),
    line('featuredHeading', 'Featured section heading', 'home', 'Heading above your featured videos.', 60),
    line('introHeading', 'Introduction heading', 'home'),
    para('introText', 'Introduction text', 'home'),
    line('ctaEyebrow', 'Bottom banner: small label', 'home', 'Shown at the bottom of the home and about pages.', 60),
    line('ctaHeading', 'Bottom banner: heading', 'home'),

    // ---------- About ----------
    line('aboutHeading', 'About heading', 'about'),
    defineField({
      name: 'aboutTags',
      title: 'About tags',
      type: 'array',
      group: 'about',
      description: 'The small pills under the about heading.',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'aboutParagraphs',
      title: 'About paragraphs',
      type: 'array',
      group: 'about',
      description: 'One box per paragraph. Drag to reorder.',
      of: [defineArrayMember({type: 'text', rows: 4})],
    }),
    line('education', 'Education', 'about'),

    // ---------- Experience ----------
    defineField({
      name: 'experience',
      title: 'Experience',
      type: 'array',
      group: 'experience',
      description: 'Your jobs, newest first. Drag to reorder.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'experienceItem',
          title: 'Job',
          fields: [
            defineField({name: 'org', title: 'Company / client', type: 'string', validation: (r) => r.required().max(80)}),
            defineField({name: 'role', title: 'Your role', type: 'string', validation: (r) => r.max(80)}),
            defineField({name: 'when', title: 'Dates', type: 'string', description: 'e.g. "Feb 2026 – Sep 2026"', validation: (r) => r.max(60)}),
            defineField({name: 'current', title: 'I still work here', type: 'boolean', description: 'Shows a green "Active" badge.', initialValue: false}),
            defineField({name: 'text', title: 'What you did', type: 'text', rows: 3, validation: (r) => r.max(600)}),
            defineField({
              name: 'clients',
              title: 'Clients (optional)',
              type: 'array',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'clientItem',
                  title: 'Client',
                  fields: [
                    defineField({name: 'name', title: 'Client', type: 'string', validation: (r) => r.max(80)}),
                    defineField({name: 'text', title: 'What you did', type: 'text', rows: 2, validation: (r) => r.max(400)}),
                  ],
                }),
              ],
            }),
          ],
          preview: {select: {title: 'org', subtitle: 'when', role: 'role'}, prepare: ({title, subtitle, role}) => ({title, subtitle: [role, subtitle].filter(Boolean).join(' · ')})},
        }),
      ],
    }),

    // ---------- Testimonials ----------
    defineField({
      name: 'testimonials',
      title: 'Testimonials',
      type: 'array',
      group: 'testimonials',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'testimonialItem',
          title: 'Testimonial',
          fields: [
            defineField({name: 'name', title: 'Name', type: 'string', validation: (r) => r.required().max(60)}),
            defineField({name: 'role', title: 'Role / company', type: 'string', validation: (r) => r.max(80)}),
            defineField({name: 'quote', title: 'Quote', type: 'text', rows: 5, validation: (r) => r.required().max(900)}),
            defineField({
              name: 'practice',
              title: 'Colour',
              type: 'string',
              options: {list: [{title: 'AI (blue)', value: 'ai'}, {title: 'Motion (orange)', value: 'motion'}], layout: 'radio', direction: 'horizontal'},
              initialValue: 'ai',
            }),
          ],
          preview: {select: {title: 'name', subtitle: 'role'}},
        }),
      ],
    }),

    // ---------- Skills & workflow ----------
    defineField({
      name: 'tools',
      title: 'Skills & tools',
      type: 'array',
      group: 'skills',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'toolGroup',
          title: 'Tool group',
          fields: [
            defineField({name: 'name', title: 'Group name', type: 'string', validation: (r) => r.required().max(60)}),
            defineField({name: 'color', title: 'Colour', type: 'string', options: {list: COLORS, layout: 'radio', direction: 'horizontal'}, initialValue: 'neutral'}),
            defineField({name: 'items', title: 'Tools', type: 'array', of: [defineArrayMember({type: 'string'})], options: {layout: 'tags'}}),
          ],
          preview: {select: {title: 'name', items: 'items'}, prepare: ({title, items}) => ({title, subtitle: (items || []).join(', ')})},
        }),
      ],
    }),
    defineField({
      name: 'ticker',
      title: 'Moving tools strip (home page)',
      type: 'array',
      group: 'skills',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tickerItem',
          title: 'Item',
          fields: [
            defineField({name: 'text', title: 'Text', type: 'string', validation: (r) => r.required().max(40)}),
            defineField({name: 'color', title: 'Colour', type: 'string', options: {list: COLORS, layout: 'radio', direction: 'horizontal'}, initialValue: 'neutral'}),
          ],
          preview: {select: {title: 'text', subtitle: 'color'}},
        }),
      ],
    }),
    defineField({
      name: 'workflow',
      title: 'Creative workflow steps',
      type: 'array',
      group: 'skills',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'workflowStep',
          title: 'Step',
          fields: [
            defineField({name: 'title', title: 'Step name', type: 'string', validation: (r) => r.required().max(60)}),
            defineField({name: 'text', title: 'Description', type: 'text', rows: 2, validation: (r) => r.max(300)}),
          ],
          preview: {select: {title: 'title', subtitle: 'text'}},
        }),
      ],
    }),

    // ---------- Contact ----------
    line('contactHeading', 'Contact page heading', 'contact'),
    para('contactLead', 'Contact page text', 'contact'),
    defineField({name: 'email', title: 'Email', type: 'string', group: 'contact', validation: (r) => r.email()}),
    line('phone', 'Phone / WhatsApp', 'contact', undefined, 30),
    defineField({name: 'linkedin', title: 'LinkedIn link', type: 'url', group: 'contact', validation: (r) => r.uri({scheme: ['https']})}),
    line('linkedinLabel', 'LinkedIn text shown', 'contact', 'e.g. "in/abhinav-kunwar"', 60),
    defineField({name: 'calendly', title: 'Calendly link ("Book a Call")', type: 'url', group: 'contact', validation: (r) => r.uri({scheme: ['https']})}),
    line('location', 'City', 'contact', 'Shown on the home, about and contact pages and in the footer.', 60),

    // ---------- Gallery pages ----------
    para('aiBlurb', 'AI Video: card text', 'galleries', 'Short text on the AI Video card (home and portfolio pages).', 2),
    para('aiIntro', 'AI Video: page intro', 'galleries'),
    para('aiShortDetail', 'AI Video: Short form text', 'galleries', undefined, 2),
    para('aiLongDetail', 'AI Video: Long form text', 'galleries', undefined, 2),
    para('motionBlurb', 'Motion Graphics: card text', 'galleries', 'Short text on the Motion Graphics card (home and portfolio pages).', 2),
    para('motionIntro', 'Motion Graphics: page intro', 'galleries'),
    para('motionShortDetail', 'Motion Graphics: Short form text', 'galleries', undefined, 2),
    para('motionLongDetail', 'Motion Graphics: Long form text', 'galleries', undefined, 2),
  ],
  preview: {prepare: () => ({title: 'Website text', subtitle: 'Headings, about, experience, testimonials, contact'})},
})
