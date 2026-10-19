// All page text lives here. Source: claude/portfolio-content.md (approved 19 Oct 2026).
// To update something on the site, edit this file only.

export type Pill = { label: string; tone: "blue" | "pink" | "green" | "orange" };

export const site = {
  name: "Jayson Kong",
  url: "https://jaysonk.vercel.app",
  description:
    "Jayson Kong is an AI engineer based in Kuala Lumpur. Projects, experience and skills.",
  email: "xianggen13@gmail.com",
  linkedin: "https://www.linkedin.com/in/xianggen/",
  github: "https://github.com/kxianggen",
  resume: "/resume.pdf",
};

// Hero layout, in René Coignard's coordinate system (renecoignard.com SVG units, font = 28 units).
// The whole hero (words + sketch) lives in one box and scales together.
// x, y = centre of the word; r = tilt in degrees. Move a word by editing its x / y / r.
export const heroBox = { x0: 990, y0: 702, w: 1030, h: 1048, font: 28 };
export const heroSketch = { x: 1345, y: 1250, w: 470 }; // top-left corner + width

export type HeroWord = {
  text: string;
  x: number;
  y: number;
  r: number;
  href?: string;
  target?: "contact" | "education" | "experience" | "projects" | "skills" | "certifications" | "resume";
  arrows?: boolean;
};

export const heroWords: HeroWord[] = [
  // links, stepping down from upper right to lower left
  { text: "CONTACT", x: 1430, y: 752, r: -8.2, href: "#contact", target: "contact" },
  { text: "EDUCATION", x: 1288, y: 878, r: 4.2, href: "#education", target: "education" },
  { text: "EXPERIENCE", x: 1501, y: 933, r: -17.2, href: "#experience", target: "experience", arrows: true },
  { text: "PROJECTS", x: 1327, y: 1052, r: -6, href: "#projects", target: "projects" },
  { text: "SKILLS", x: 1224, y: 1127, r: 4.9, href: "#skills", target: "skills" },
  { text: "CERTIFICATIONS", x: 1215, y: 1200, r: -1.8, href: "#certifications", target: "certifications" },
  { text: "RESUME", x: 1072, y: 1281, r: 5.6, href: "/resume.pdf", target: "resume" },
  // bio: name, a dip, a steep kink, a long rise, then two short lines stepping down to the right
  { text: "JAYSON", x: 1143, y: 1377, r: -10.1 },
  { text: "KONG", x: 1256, y: 1343, r: -22.1 },
  { text: "IS", x: 1358, y: 1358, r: -24.7 },
  { text: "AN", x: 1404, y: 1290, r: -37.8 },
  { text: "AI ENGINEER", x: 1533, y: 1208, r: -26.2 },
  { text: "BASED IN", x: 1700, y: 1195, r: -15.5 },
  { text: "KUALA", x: 1760, y: 1249, r: -15.5 },
  { text: "LUMPUR.", x: 1881, y: 1236, r: -6.1 },
];

export const education = [
  {
    title: "Sunway University",
    dates: "Sep 2023 – Aug 2026",
    pills: [
      { label: "BSc (Hons) Computer Science", tone: "pink" },
      { label: "First Class", tone: "pink" },
    ] as Pill[],
    body: "Dual award with Lancaster University, UK. CGPA 3.81 / 4.00, on the Dean's List for five semesters, and a Jeffrey Cheah ACE Scholarship. Coursework leaned into AI, computational intelligence, data mining and distributed systems.",
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
      "I built front-end pages for ",
      { text: "DBS Bank's Annual Report 2025", href: "https://www.dbs.com/annualreports/2025/index.html" },
      " and ",
      { text: "DBS Foundation", href: "https://www.dbs.com/foundation/index.html" },
      ": a sticky navigation bar that reacts to scrolling, CSS animations, and layouts that match the Figma designs on every screen size. As the only technical intern in the KL office, I worked with developers in Singapore, Vietnam and Myanmar, fixed client feedback ticket by ticket, and checked staging against the live sites before each release.",
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
      "I built and sold custom mechanical keyboards: 400+ orders with a 5-star rating across Shopee, Carousell and Facebook Marketplace. I ran all of it myself — customer consultations, sourcing parts from overseas, stock and marketing.",
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
      "I worked every station, from the till to the head-barista bar: dialling in espresso, pouring latte art and logging incoming stock, during a stretch when daily sales grew by about two-thirds.",
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
    body: "Ask questions about six chipmakers' annual reports and get answers with sources — or an honest \"not in the filings\". Accuracy rose from 0.55 to 0.77 over 15+ tested changes.",
    note: "Free hosting: the live demo can take a minute to wake up.",
    github: "https://github.com/kxianggen/sec-rag",
    live: "https://filinglens-wtl8.onrender.com",
    preview: "/previews/proj-filinglens.webp",
    previewAlt: "FilingLens question-answering page",
  },
  {
    title: "Sharkeys",
    dates: "May 2026 – Aug 2026",
    body: "An AI keyboard configurator where a rule engine, not the AI, decides which parts fit — so it never recommends a build that can't exist. My final-year project, graded A+.",
    github: "https://github.com/kxianggen/sharkeys",
    live: "https://sharkeys.vercel.app",
    preview: "/previews/proj-sharkeys.webp",
    previewAlt: "Sharkeys keyboard configurator homepage",
  },
  {
    title: "AI Newsletter SaaS",
    dates: "Oct 2025 – Nov 2025",
    body: "A web app that writes personalised newsletters with the OpenAI API and sends them on a schedule in the background.",
    github: null,
  },
];

export type Skill = { name: string; icon: string; tag: string; line: string };

export const skillFolders: { id: string; name: string; tile: string[]; items: Skill[] }[] = [
  {
    id: "ai-data",
    name: "AI & Data",
    // first 3 = big icons, next 4 = small icons
    tile: ["python", "openai", "postgresql", "langgraph", "sql", "rag", "eval"],
    items: [
      { name: "Python", icon: "python", tag: "LANGUAGE", line: "FilingLens' retrieval pipeline and API." },
      { name: "SQL", icon: "sql", tag: "LANGUAGE", line: "Queries behind FilingLens and Sharkeys." },
      { name: "PostgreSQL + pgvector", icon: "postgresql", tag: "DATABASE", line: "Vector search in FilingLens and Sharkeys." },
      { name: "OpenAI API", icon: "openai", tag: "API", line: "Answers in FilingLens, intent reading in Sharkeys, writing in the newsletter app." },
      { name: "LangGraph", icon: "langgraph", tag: "FRAMEWORK", line: "Sharkeys' step-by-step AI pipeline." },
      { name: "RAG", icon: "rag", tag: "TECHNIQUE", line: "FilingLens answers only from the filings and cites them." },
      { name: "Hybrid search", icon: "hybrid", tag: "TECHNIQUE", line: "FilingLens mixes keyword (BM25) and meaning-based search." },
      { name: "LLM evaluation", icon: "eval", tag: "TECHNIQUE", line: "A 30-question test set and a checked AI judge for FilingLens; a 58-case suite for Sharkeys." },
    ],
  },
  {
    id: "build-ship",
    name: "Build & Ship",
    tile: ["typescript", "react", "nextdotjs", "fastapi", "docker", "supabase", "vercel"],
    items: [
      { name: "TypeScript", icon: "typescript", tag: "LANGUAGE", line: "Sharkeys and the newsletter app." },
      { name: "JavaScript", icon: "javascript", tag: "LANGUAGE", line: "Front-end work at Clickr." },
      { name: "Java", icon: "openjdk", tag: "LANGUAGE", line: "Learned and used in university coursework at Sunway." },
      { name: "React", icon: "react", tag: "FRAMEWORK", line: "The interfaces of Sharkeys and the newsletter app." },
      { name: "Next.js", icon: "nextdotjs", tag: "FRAMEWORK", line: "Sharkeys and the newsletter app." },
      { name: "FastAPI", icon: "fastapi", tag: "FRAMEWORK", line: "FilingLens' backend." },
      { name: "Supabase", icon: "supabase", tag: "DATABASE", line: "Database and login for Sharkeys; the newsletter app." },
      { name: "Docker", icon: "docker", tag: "TOOL", line: "FilingLens is packaged and deployed in a container." },
      { name: "Git", icon: "git", tag: "TOOL", line: "GitHub for my projects; GitLab in a three-country team at Clickr." },
      { name: "Vercel", icon: "vercel", tag: "PLATFORM", line: "Hosts Sharkeys — and this site." },
      { name: "Linux", icon: "linux", tag: "TOOL", line: "Learned and used in university coursework at Sunway." },
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
