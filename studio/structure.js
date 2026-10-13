import {PlayIcon} from '@sanity/icons/Play'
import {StarIcon} from '@sanity/icons/Star'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {ColorWheelIcon} from '@sanity/icons/ColorWheel'

/* Left-hand menu: every project, then the same lists the website shows. */
const list = (S, title, filter, params, icon) =>
  S.listItem()
    .title(title)
    .icon(icon)
    .child(
      S.documentTypeList('project')
        .title(title)
        .filter(`_type == "project" && ${filter}`)
        .params(params || {})
        .defaultOrdering([{field: 'order', direction: 'asc'}, {field: '_createdAt', direction: 'desc'}]),
    )

export const structure = (S) =>
  S.list()
    .title('Portfolio')
    .items([
      S.listItem()
        .title('All projects')
        .icon(PlayIcon)
        .child(S.documentTypeList('project').title('All projects').defaultOrdering([{field: 'order', direction: 'asc'}])),
      S.divider(),
      list(S, 'AI Video · Short Form', 'category == "ai-video" && format == "short-form"', null, SparklesIcon),
      list(S, 'AI Video · Long Form', 'category == "ai-video" && format == "long-form"', null, SparklesIcon),
      list(S, 'Motion Graphics · Short Form', 'category == "motion-graphics" && format == "short-form"', null, ColorWheelIcon),
      list(S, 'Motion Graphics · Long Form', 'category == "motion-graphics" && format == "long-form"', null, ColorWheelIcon),
      S.divider(),
      list(S, 'Featured on home page', 'featured == true', null, StarIcon),
    ])
