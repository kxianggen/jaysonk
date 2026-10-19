// All page text lives here. Source: claude/portfolio-content.md (approved 19 Oct 2026).
// To update something on the site, edit this file only.

export type Pill = { label: string; tone: "blue" | "pink" | "green" | "orange" };

export const site = {
  name: "Jayson Kong",
  url: "https://jaysonkong.dev",
  title: "Jayson Kong · CS fresh grad building with AI",
  bio: "Jayson Kong is a CS fresh grad who builds things with AI, based in Kuala Lumpur.",
  description:
    "Jayson Kong is a CS fresh grad who builds things with AI, based in Kuala Lumpur. Projects, experience and skills.",
  email: "xianggen13@gmail.com",
  linkedin: "https://www.linkedin.com/in/xianggen/",
  github: "https://github.com/kxianggen",
  resume: "/resume.pdf",
};

// Hero layout, in René Coignard's coordinate system (renecoignard.com SVG units, font = 28 units).
// The whole hero (words + sketch) lives in one box and scales together.
// x, y = centre of the word; r = tilt in degrees. Move a word by editing its x / y / r.
export const heroBox = { x0: 990, y0: 696, w: 1030, h: 984, font: 28 };
export const heroSketch = { x: 1280, y: 1172, w: 620 }; // the drawing: top-left corner + width

export type HeroWord = {
  text: string;
  x: number;
  y: number;
  r: number;
  href?: string;
  target?: "contact" | "education" | "experience" | "projects" | "skills" | "certifications" | "resume";
  arrows?: boolean;
  hint?: boolean; // can wear the "Grab me!" bubble (only words with clear space above them)
};

export const heroWords: HeroWord[] = [
  // links, stepping down from upper right to lower left
  { text: "CONTACT", x: 1405, y: 746, r: -8.2, href: "#contact", target: "contact", hint: true },
  { text: "EDUCATION", x: 1288, y: 878, r: 4.2, href: "#education", target: "education" },
  { text: "EXPERIENCE", x: 1501, y: 933, r: -17.2, href: "#experience", target: "experience", arrows: true, hint: true },
  { text: "PROJECTS", x: 1327, y: 1052, r: -6, href: "#projects", target: "projects" },
  { text: "SKILLS", x: 1224, y: 1127, r: 4.9, href: "#skills", target: "skills" },
  { text: "CERTIFICATIONS", x: 1215, y: 1200, r: -1.8, href: "#certifications", target: "certifications" },
  { text: "RESUME", x: 1072, y: 1281, r: 5.6, href: "/resume.pdf", target: "resume" },
  // bio: name, a dip, a steep kink, a long rise, then two short lines stepping down to the right
  { text: "JAYSON", x: 1082, y: 1392, r: -10.1 },
  { text: "KONG", x: 1195, y: 1358, r: -22.1 },
  { text: "IS A CS", x: 1297, y: 1387, r: -20 },
  { text: "FRESH GRAD", x: 1438, y: 1300, r: -37.8 },
  { text: "WHO BUILDS", x: 1606, y: 1194, r: -26.2, hint: true },
  { text: "THINGS", x: 1757, y: 1134, r: -20, hint: true },
  { text: "WITH AI,", x: 1770, y: 1230, r: -15.5 },
  { text: "BASED IN", x: 1911, y: 1203, r: -10 },
  { text: "KUALA", x: 1806, y: 1300, r: -14 },
  { text: "LUMPUR.", x: 1934, y: 1268, r: -10 },
];

export const education = [
  {
    title: "Sunway University",
    dates: "Sep 2023 – Aug 2026",
    pills: [
      { label: "BSc (Hons) Computer Science", tone: "pink" },
      { label: "First Class", tone: "pink" },
    ] as Pill[],
    body: "Three years of computer science, as a dual degree with Lancaster University in the UK. I studied on a Jeffrey Cheah ACE Scholarship, made the Dean's List five times and finished with a 3.81 CGPA. By the last year, most of my classes were about AI and data.",
  },
];

// body segments: strings are text, objects are inline links (open in a new tab).
export type Segment = string | { text: string; href: string };

export const experience: {
  title: string;
  dates: string;
  pills: Pill[];
  href: string;
  preview: string;
  previewAlt: string;
  body: Segment[];
}[] = [
  {
    title: "Clickr (Malaysia)",
    dates: "Jan 2026 – Apr 2026",
    pills: [{ label: "Role: Full Stack Web Developer Intern", tone: "blue" }],
    href: "https://www.clickrmedia.com/",
    preview: "/previews/exp-clickr.webp",
    previewAlt: "Clickr website homepage",
    body: [
      "My first time in a proper dev team. I was the only tech intern in the KL office, building pages for ",
      { text: "DBS Bank's Annual Report 2025", href: "https://www.dbs.com/annualreports/2025/index.html" },
      " and the ",
      { text: "DBS Foundation", href: "https://www.dbs.com/foundation/index.html" },
      " website alongside developers in Singapore, Vietnam and Myanmar. Most days were about making pages look right on every screen and fixing whatever the client sent back.",
    ],
  },
  {
    title: "Sharkeys",
    dates: "Dec 2022 – Nov 2025",
    pills: [{ label: "Role: Founder & Builder", tone: "blue" }],
    href: "https://shopee.com.my/sharkeys.my",
    preview: "/previews/exp-sharkeys.webp",
    previewAlt: "Sharkeys shop page on Shopee",
    body: [
      "I started selling custom mechanical keyboards while studying, and it grew to 400+ orders with a 5-star rating on Shopee, Carousell and Facebook Marketplace. I did everything myself, from chatting with customers about their dream board to ordering parts from overseas.",
    ],
  },
  {
    title: "Talker Coffee & Chocolate",
    dates: "May 2025 – Nov 2025",
    pills: [{ label: "Role: Part-Time Barista", tone: "blue" }],
    href: "https://www.instagram.com/talker.my/",
    preview: "/previews/exp-talker.webp",
    previewAlt: "Talker Coffee & Chocolate on Instagram",
    body: [
      "My part-time job behind the coffee bar. I worked every station, from the till to the espresso machine, poured a lot of latte art and helped keep track of stock. The shop got much busier while I was there, with daily sales up by about two-thirds.",
    ],
  },
];

export const projects: {
  title: string;
  dates: string;
  body: string;
  note?: string;
  github: string | null; // null = link coming soon
  live?: string;
  preview?: string;
  previewAlt?: string;
}[] = [
  {
    title: "FilingLens",
    dates: "Sep 2026 – Oct 2026",
    body: "Company annual reports run to hundreds of pages, so I made something that reads them for you. Ask a question about one of six big chip companies and it answers, showing where in the report it found it. If the answer isn't in there, it just says so.",
    note: "It runs on free hosting, so give it a minute to wake up.",
    github: "https://github.com/kxianggen/sec-rag",
    live: "https://filinglens-wtl8.onrender.com",
    preview: "/previews/proj-filinglens.webp",
    previewAlt: "FilingLens question-answering page",
  },
  {
    title: "Sharkeys",
    dates: "May 2026 – Aug 2026",
    body: "A keyboard builder for anyone who wants a custom mechanical keyboard but has no idea where to start. Describe the feel you're after, even something like \"buttery smooth\", and it picks parts that actually fit together. It grew out of my keyboard shop and became my final-year project.",
    github: "https://github.com/kxianggen/sharkeys",
    live: "https://sharkeys.vercel.app",
    preview: "/previews/proj-sharkeys.webp",
    previewAlt: "Sharkeys keyboard configurator homepage",
  },
  {
    title: "AI Newsletter SaaS",
    dates: "Oct 2025 – Nov 2025",
    body: "Your own personal newsletter. Pick the topics you care about, and AI writes you a fresh issue and sends it over on a schedule.",
    github: null,
  },
];

export type Skill = { name: string; icon: string; tag: string };

export const skillFolders: { id: string; name: string; tile: string[]; items: Skill[] }[] = [
  {
    id: "ai-data",
    name: "AI & Data",
    // first 3 = big icons, next 4 = small icons
    tile: ["python", "openai", "postgresql", "langgraph", "sql", "rag", "eval"],
    items: [
      { name: "Python", icon: "python", tag: "LANGUAGE" },
      { name: "SQL", icon: "sql", tag: "LANGUAGE" },
      { name: "PostgreSQL + pgvector", icon: "postgresql", tag: "DATABASE" },
      { name: "OpenAI API", icon: "openai", tag: "API" },
      { name: "LangGraph", icon: "langgraph", tag: "FRAMEWORK" },
      { name: "RAG", icon: "rag", tag: "TECHNIQUE" },
      { name: "Hybrid search", icon: "hybrid", tag: "TECHNIQUE" },
      { name: "LLM evaluation", icon: "eval", tag: "TECHNIQUE" },
    ],
  },
  {
    id: "build-ship",
    name: "Build & Ship",
    tile: ["typescript", "react", "nextdotjs", "fastapi", "docker", "supabase", "vercel"],
    items: [
      { name: "TypeScript", icon: "typescript", tag: "LANGUAGE" },
      { name: "JavaScript", icon: "javascript", tag: "LANGUAGE" },
      { name: "Java", icon: "openjdk", tag: "LANGUAGE" },
      { name: "React", icon: "react", tag: "FRAMEWORK" },
      { name: "Next.js", icon: "nextdotjs", tag: "FRAMEWORK" },
      { name: "FastAPI", icon: "fastapi", tag: "FRAMEWORK" },
      { name: "Supabase", icon: "supabase", tag: "DATABASE" },
      { name: "Docker", icon: "docker", tag: "TOOL" },
      { name: "Git", icon: "git", tag: "TOOL" },
      { name: "Vercel", icon: "vercel", tag: "PLATFORM" },
      { name: "Linux", icon: "linux", tag: "TOOL" },
    ],
  },
];

export const certifications: {
  title: string;
  issuer: string;
  date?: string;
  pill?: Pill;
  href: string | null; // null = link coming soon
}[] = [
  { title: "IBM RAG and Agentic AI Professional Certificate", issuer: "IBM", pill: { label: "Expected Oct 2026", tone: "orange" }, href: null },
  { title: "Meta Front-End Developer Professional Certificate", issuer: "META", href: null },
  { title: "Google UX Design Professional Certificate", issuer: "GOOGLE", href: null },
];
