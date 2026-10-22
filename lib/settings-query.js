"use strict";

/**
 * The "Website text" document edited in Sanity Studio (one document, id "siteSettings").
 * Only the published version is read; the site falls back to the text in public/js/data.js for anything left empty.
 */
module.exports = `*[_id == "siteSettings"][0]{
  heroRole, heroHeading, heroLead, featuredHeading, introHeading, introText, ctaEyebrow, ctaHeading,
  aboutHeading, aboutTags, aboutParagraphs, education,
  contactHeading, contactLead, email, phone, linkedin, linkedinLabel, calendly, location,
  experience[]{role, org, when, current, text, clients[]{name, text}},
  testimonials[]{name, role, quote, practice},
  tools[]{name, color, items},
  ticker[]{text, color},
  workflow[]{title, text},
  aiBlurb, aiIntro, aiShortDetail, aiLongDetail,
  motionBlurb, motionIntro, motionShortDetail, motionLongDetail
}`;
