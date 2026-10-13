"use strict";

/**
 * The one GROQ query for portfolio projects — used by the Express API (lib/sanity.js)
 * and by the static build for GitHub Pages (scripts/build.js). Edit it here only.
 *
 * Only published documents are returned: the client uses the "published" perspective, and draft IDs
 * ("drafts.…") are excluded as a second safeguard. Incomplete documents are skipped so a card can never break.
 */
module.exports = `*[_type == "project"
  && !(_id in path("drafts.**"))
  && defined(slug.current) && defined(title) && defined(wistiaId)
  && category in ["ai-video", "motion-graphics"]
  && format in ["short-form", "long-form"]
] | order(coalesce(order, 9999) asc, _createdAt desc) {
  "id": slug.current,
  title,
  "description": shortDescription,
  category,
  format,
  wistiaId,
  clientName,
  tags,
  featured,
  order,
  "thumbnail": select(defined(thumbnail.asset) => {
    "url": thumbnail.asset->url,
    "alt": thumbnail.alt,
    "crop": thumbnail.crop,
    "hotspot": thumbnail.hotspot,
    "width": thumbnail.asset->metadata.dimensions.width,
    "height": thumbnail.asset->metadata.dimensions.height
  }),
  _createdAt,
  _updatedAt
}`;
