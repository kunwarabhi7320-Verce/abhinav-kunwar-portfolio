/* Site content: contact details, photos, projects, experience, testimonials, tools.
   Edit this file to add or change projects — navigation and galleries update automatically. */
/* =====================================================================
   SITE CONFIG — contact details, photos and showreel.
   Photo paths are files published with this page (img/…).
   ===================================================================== */
const CONFIG = {
  name: "Abhinav Kunwar",
  email: "kunwarabhi7320@gmail.com",
  phone: "+91 7905774320",
  linkedin: "https://www.linkedin.com/in/abhinav-kunwar-20a53529a/",
  calendly: "https://calendly.com/kunwarabhi7320/30min",   // "Book a Call" on the contact page
  location: "Bangalore, India",
  photos: {
    hero: "img/abhinav-hero-jacket.webp",          // black jacket portrait, background removed
    aiPortrait: "img/abhinav-ai-hoodie.webp",       // hoodie portrait beside AI Video Projects
    motionPortrait: "img/abhinav-motion-fullbody.webp" // full-body portrait beside Motion Graphics Video Projects
  },
  showreel: { video: "", poster: "" },   // .mp4 path, or a YouTube/Vimeo/Drive link
  formEndpoint: "/api/contact",           // Express route that emails inquiries (see lib/contact.js and .env.example)
  web3formsKey: "c34c08f9-9ad7-45fd-9707-8cb4237530ea"                        // Web3Forms access key: when set, Send emails the inquiry straight to Gmail from any host
};

/* =====================================================================
   WEBSITE TEXT — headings and paragraphs on the home, about and contact pages.
   Sanity Studio → "Website text" can change any of these without code;
   anything left empty there keeps the text below.
   ===================================================================== */
const TEXT = {
  heroRole: "AI Video Editor & Motion Graphics Designer",
  heroHeading: "Where Ideas Become Visual Experiences.",   // the last two words get the AI / motion colours
  heroLead: "I blend AI filmmaking, motion graphics, and creative editing to transform ideas into compelling visual content.",
  featuredHeading: "Few Projects",
  introHeading: "Creative thinking. Modern production.",
  introText: "I combine AI-generated visuals, motion graphics, editing and sound, from AI ads for Meta and Google to long-form podcast edits.",
  ctaEyebrow: "Available for projects",
  ctaHeading: "Let's make something worth watching.",
  aboutHeading: "Creative Thinking. Modern Production.",
  aboutTags: ["AI Filmmaking", "Motion Design", "Visual Storytelling"],
  aboutParagraphs: [
    "I'm Abhinav Kunwar, an AI and motion graphics video editor focused on visual storytelling, advertising, and modern video production.",
    "I combine professional editing, AI-generated visuals, motion graphics, and sound to turn ideas into compelling video content. My work spans AI-powered advertisements, short-form social content, cinematic storytelling, and long-form editing.",
    "Using Adobe Premiere Pro, After Effects, Veo, Higgsfield AI and other emerging tools, I look for new ways to make visually distinctive content that fits each project."
  ],
  education: "B.Tech Mechanical Engineering, MMMUT Gorakhpur · 2023 – 2027",
  contactHeading: "Let's Make Something Worth Watching.",
  contactLead: "Tell me about the product, the platform and the deadline. I work with brands, agencies and creators worldwide.",
  linkedinLabel: "in/abhinav-kunwar"
};

/* =====================================================================
   PROJECTS — add, edit or remove entries. Navigation never changes.
   category: "ai-video" | "motion-graphics"
   format:   "short-form" | "long-form"
   orientation: "portrait" (9:16) | "landscape" (16:9)
   video: .mp4/.webm path plays inline (and previews on hover);
          YouTube/Vimeo/Drive/Instagram links open in a new tab; "" shows "Video coming soon".
   thumbnail: image path, or "" for the designed poster.
   Entries come from verified experience; videos still to be added.
   ===================================================================== */
const PROJECTS = [
  { id: "frnd-playchat-ai-ads", title: "PlayChat & FRND AI Ad Campaigns",
    category: "ai-video", format: "short-form", orientation: "portrait", type: "AI commercial",
    description: "AI-generated video ads for PlayChat and FRND, built for Meta Ads, Google Ads and social media channels.",
    context: "FRND · Freelance Video Editor · Feb 2026 – Sep 2026. PlayChat is part of FRND.",
    tags: ["AI Commercial", "Performance Ads", "Social"], tools: [], duration: "", video: "", thumbnail: "", approach: "", featured: true },
  { id: "killitonline-ai-marketing", title: "AI Marketing Videos",
    category: "ai-video", format: "short-form", orientation: "portrait", type: "AI-assisted production",
    description: "AI-powered marketing videos produced with Veo 3 and Higgsfield AI.",
    context: "KiLLitOnLine · Video Editor · May 2025 – Nov 2025",
    tags: ["AI Commercial", "Marketing"], tools: ["Veo 3", "Higgsfield AI"], duration: "", video: "", thumbnail: "", approach: "" },
  { id: "delhi-ai-promos", title: "AI Promotional & Social Videos",
    category: "ai-video", format: "short-form", orientation: "portrait", type: "AI promotional video",
    description: "AI-generated promotional and social media videos for a Delhi-based client.",
    context: "Freelance · Rohit, Delhi · Feb 2025 – Mar 2025",
    tags: ["AI Promo", "Social"], tools: [], duration: "", video: "", thumbnail: "", approach: "" },
  { id: "killitonline-motion-promos", title: "Motion Graphics & Promo Edits",
    category: "motion-graphics", format: "short-form", orientation: "portrait", type: "Motion design",
    description: "Motion graphics design and promotional content editing in Premiere Pro and After Effects.",
    context: "KiLLitOnLine · Video Editor · May 2025 – Nov 2025",
    tags: ["Motion Graphics", "Promo"], tools: ["Premiere Pro", "After Effects"], duration: "", video: "", thumbnail: "", approach: "", featured: true },
  { id: "jaipur-cinematic-motion", title: "Cinematic Videos & Motion Graphics",
    category: "motion-graphics", format: "short-form", orientation: "portrait", type: "Cinematic edit",
    description: "Cinematic videos and motion graphics produced to client requirements.",
    context: "Freelance · Garvit, Jaipur · Oct 2024 – Jan 2025",
    tags: ["Cinematic Editing", "Motion Graphics"], tools: [], duration: "", video: "", thumbnail: "", approach: "" },
  { id: "podcast-edits", title: "Podcast Edits",
    category: "motion-graphics", format: "long-form", orientation: "landscape", type: "Long-form edit",
    description: "Long-form podcast editing: clean pacing, multi-camera cuts and audio clean-up.",
    context: "Independent work",
    tags: ["Podcast", "Talking Head"], tools: [], duration: "", video: "", thumbnail: "", approach: "", featured: true }
];

const EXPERIENCE = [
  { role: "Freelance Video Editor", org: "FRND", when: "Feb 2026 – Sep 2026",
    text: "Worked as Lead Editor for PlayChat, creating DTC-style AI-generated video ads for advertising and social media campaigns." },
  { role: "Video Editor", org: "KiLLitOnLine", when: "May 2025 – Nov 2025",
    text: "Created DTC-style marketing videos using Veo 3 and Higgsfield AI, with motion graphics and promotional edits in Premiere Pro and After Effects." },
  { role: "Videographer & Video Editor", org: "Independent freelance", when: "Oct 2024 – Present", now: true, text: "",
    sub: [
      { org: "Rohit — Delhi", text: "Created AI-generated promotional videos, UGC-style content, and talking-head videos for social media and marketing campaigns." },
      { org: "Garvit — Jaipur", text: "Worked on UGC videos, talking-head content, cinematic edits, and motion graphics tailored to client requirements." }
    ] }
];

const TESTIMONIALS = [
  { cat: "ai", name: "Manasvi", role: "Content Strategist, FRND",
    quote: "He has demonstrated strong AI video generation skills and a great understanding of creative content production while working with FRND. He consistently delivers high-quality work ahead of deadlines and is reliable, efficient, and committed to meeting project requirements. His ability to turn ideas into engaging visual content makes him a valuable creative professional to work with." },
  { cat: "motion", name: "Garvit", role: "Client",
    quote: "Abhinav’s motion graphics and UGC content creation skills really stood out to me. His creative approach, attention to detail, and ability to produce engaging visual content made his work impressive. He has a strong understanding of creating content that captures attention and connects with the audience." }
];

const TOOLS = [
  { name: "Editing & Design", tone: "mg", items: ["Adobe Premiere Pro", "Adobe After Effects", "Adobe Photoshop", "Canva"] },
  { name: "AI Video Generation", tone: "ai", items: ["Veo 3.1", "Higgsfield AI", "Kling 3.0", "Seedance", "Nano Banana", "OpenAI Sora", "Runway ML"] },
  { name: "Audio & AI Assistance", tone: "", items: ["ElevenLabs", "Descript", "ChatGPT", "Claude", "Gemini"] },
  { name: "Creative Skills", tone: "", items: ["Visual storytelling", "Motion graphics", "Colour grading", "Audio mixing", "Speed ramping", "Rotoscoping", "3D camera techniques", "Typography & design"] }
];
const TICKER = [["Veo 3.1","a"],["After Effects","m"],["Higgsfield AI","a"],["Premiere Pro","m"],["Kling 3.0","a"],["Kinetic type","m"],["Seedance","a"],["Photoshop","m"],["Nano Banana","a"],["Colour grading","m"],["ElevenLabs",""],["Sora","a"],["Rotoscoping","m"],["Runway ML","a"]];

const WORKFLOW = [
  { t: "Brief & references", d: "Goal, platform, audience and reference ads agreed before anything is made." },
  { t: "Script & prompts", d: "Hook, structure and shot list. For AI work, image and video prompts for each shot." },
  { t: "Generate or gather", d: "AI generation with Nano Banana, Veo, Kling or Seedance, or the client's own footage." },
  { t: "Edit & animate", d: "Pacing, cuts, captions, kinetic type and motion graphics in Premiere Pro and After Effects." },
  { t: "Sound & colour", d: "Voiceover with ElevenLabs, sound design, audio mixing and the colour grade." },
  { t: "Deliver", d: "Exports for 9:16, 1:1 and 16:9 placements, then revision rounds." }
];

const CATS = {
  ai: {
    key: "ai-video", slug: "ai", name: "AI Video Projects", short: "AI Video", lines: ["AI Video", "Projects"],
    blurb: "AI-generated commercials, cinematic AI videos and AI-assisted productions.",
    intro: "Commercials, cinematic sequences and AI-assisted productions where the footage itself is generated with Veo, Higgsfield, Kling, Seedance and Nano Banana, then cut and finished by hand.",
    fx: "Generated light",
    short: { title: "Short form", detail: "AI DTC and product ads, UGC-style creatives, cinematic reels and short campaigns.", empty: "AI short-form pieces will appear here." },
    long: { title: "Long form", detail: "AI short films, narrative brand films, extended commercials and multi-scene AI productions.", empty: "Long-form AI films are in production. This gallery is ready for them." }
  },
  motion: {
    key: "motion-graphics", slug: "motion", name: "Motion Graphics Video Projects", short: "Motion Graphics", lines: ["Motion Graphics", "Video Projects"],
    blurb: "Motion design, kinetic typography, animated visuals and promotional edits.",
    intro: "Motion design, typography, animated visuals and promotional edits built in After Effects and Premiere Pro, plus the long-form editing work around them.",
    fx: "Keyframed",
    short: { title: "Short form", detail: "Motion-graphics ads, kinetic-type reels, promos, DTC and UGC edits.", empty: "Short-form motion pieces will appear here." },
    long: { title: "Long form", detail: "YouTube videos, podcasts, talking-head content and longer promotional films.", empty: "Long-form edits will appear here." }
  }
};
const KEY_TO_SLUG = { "ai-video": "ai", "motion-graphics": "motion" };
const FMT_TO_SLUG = { "short-form": "short", "long-form": "long" };
const ALIASES = { edits: "motion", "edits-short": "motion-short", "edits-long": "motion-long", "ai-video-editor": "ai" };
