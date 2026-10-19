import {
  siPython,
  siOpenai,
  siPostgresql,
  siLanggraph,
  siTypescript,
  siJavascript,
  siOpenjdk,
  siHtml5,
  siCss,
  siNextdotjs,
  siFastapi,
  siSupabase,
  siDocker,
  siGit,
  siVercel,
  siLinux,
  siGithub,
} from "simple-icons";

// Brand logos come from Simple Icons (CC0). Techniques without an official logo
// (SQL, RAG, hybrid search, LLM evaluation) get simple drawn symbols in a matching weight.
const brand: Record<string, string> = {
  python: siPython.path,
  openai: siOpenai.path,
  postgresql: siPostgresql.path,
  langgraph: siLanggraph.path,
  typescript: siTypescript.path,
  javascript: siJavascript.path,
  openjdk: siOpenjdk.path,
  html5: siHtml5.path,
  css: siCss.path,
  nextdotjs: siNextdotjs.path,
  fastapi: siFastapi.path,
  supabase: siSupabase.path,
  docker: siDocker.path,
  git: siGit.path,
  vercel: siVercel.path,
  linux: siLinux.path,
  github: siGithub.path,
};

const drawn: Record<string, React.ReactNode> = {
  // database cylinder
  sql: (
    <>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="3" />
      <path d="M4.5 5.5v13c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-13" />
      <path d="M4.5 12c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3" />
    </>
  ),
  // document feeding a speech bubble: answers grounded in sources
  rag: (
    <>
      <path d="M4 2.5h8l4 4v8.5H4z" />
      <path d="M12 2.5v4h4" />
      <path d="M7 9.5h6M7 12.5h4" />
      <path d="M14 17.5h6.5v4l-2.5-2h-4z" />
    </>
  ),
  // two overlapping lenses: keyword + meaning search
  hybrid: (
    <>
      <circle cx="9" cy="10" r="5.5" />
      <circle cx="14" cy="10" r="5.5" />
      <path d="M18 14.5l4 4.5" />
    </>
  ),
  // clipboard with ticks: evaluation set
  eval: (
    <>
      <rect x="4.5" y="3.5" width="15" height="18" rx="2" />
      <path d="M9 3.5V2h6v1.5" />
      <path d="M8 10l1.6 1.6L12.5 8.7M8 16l1.6 1.6 2.9-2.9" />
      <path d="M14.5 10.5h2.5M14.5 16.5h2.5" />
    </>
  ),
  linkedin: (
    <>
      <rect x="2.5" y="2.5" width="19" height="19" rx="3" />
      <path d="M7.5 10v6.5M7.5 7.2v.1M11 16.5V10M11 13c0-1.7 1.1-3 2.8-3s2.7 1.1 2.7 3v3.5" />
    </>
  ),
  mail: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M3 6l9 7 9-7" />
    </>
  ),
};

export function Icon({ name, size = 24, title }: { name: string; size?: number; title?: string }) {
  const label = title ? { role: "img", "aria-label": title } : { "aria-hidden": true };
  if (brand[name]) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" {...label}>
        <path d={brand[name]} />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...label}
    >
      {drawn[name]}
    </svg>
  );
}
