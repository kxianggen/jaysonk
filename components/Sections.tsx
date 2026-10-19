import { certifications, education, experience, projects, site, type Pill } from "@/lib/content";
import { Icon } from "./Icon";

function Pills({ pills }: { pills: Pill[] }) {
  return (
    <div className="pills">
      {pills.map((p) => (
        <span key={p.label} className={`pill pill-${p.tone}`}>
          {p.label}
        </span>
      ))}
    </div>
  );
}

function SectionLabel({ id, children }: { id: string; children: string }) {
  return (
    <h2 className="label" id={`${id}-label`}>
      {children}
    </h2>
  );
}

export function Education() {
  return (
    <section id="education" className="section" tabIndex={-1} aria-labelledby="education-label">
      <SectionLabel id="education">EDUCATION</SectionLabel>
      <ul className="entries">
        {education.map((e) => (
          <li key={e.title} className="entry entry-static">
            <h3 className="entry-head">
              <span className="entry-title">{e.title}</span>
              <span className="meta">{e.dates}</span>
            </h3>
            <Pills pills={e.pills} />
            <p className="entry-body">{e.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Experience() {
  return (
    <section id="experience" className="section" tabIndex={-1} aria-labelledby="experience-label">
      <SectionLabel id="experience">EXPERIENCE</SectionLabel>
      <ul className="entries">
        {experience.map((e) => (
          <li key={e.title} className="entry" data-preview={e.preview} data-preview-alt={e.previewAlt}>
            <h3 className="entry-head">
              {/* the title link stretches over the whole entry (see .stretch in CSS) */}
              <a className="entry-title stretch" href={e.href} target="_blank" rel="noopener noreferrer">
                {e.title}
              </a>
              <span className="meta">{e.dates}</span>
            </h3>
            <Pills pills={e.pills} />
            <p className="entry-body">
              {e.body.map((s, i) =>
                typeof s === "string" ? (
                  s
                ) : (
                  <a key={i} className="inline-link" href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.text}
                  </a>
                ),
              )}
            </p>
            <img className="thumb" src={e.preview} alt={e.previewAlt} width={800} height={500} loading="lazy" />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RowLink({ href, label }: { href: string | null | undefined; label: string }) {
  if (!href) {
    return (
      <span className="row-link is-soon" title="Link coming soon">
        {label} <span aria-hidden="true">↗</span>
        <span className="sr-only"> (link coming soon)</span>
      </span>
    );
  }
  return (
    <a className="row-link" href={href} target="_blank" rel="noopener noreferrer">
      {label} <span className="arrow" aria-hidden="true">↗</span>
    </a>
  );
}

export function Projects() {
  return (
    <section id="projects" className="section" tabIndex={-1} aria-labelledby="projects-label">
      <SectionLabel id="projects">PROJECTS</SectionLabel>
      <ul className="rows">
        {projects.map((p) => (
          <li key={p.title} className="row" data-preview={p.preview} data-preview-alt={p.previewAlt}>
            <div className="row-main">
              <h3 className="row-head">
                <span className="row-title">{p.title}</span>
                <span className="meta">{p.dates}</span>
              </h3>
              <p className="row-body">{p.body}</p>
              {p.note ? <p className="row-note">{p.note}</p> : null}
              {p.preview ? (
                <img className="thumb" src={p.preview} alt={p.previewAlt ?? ""} width={800} height={500} loading="lazy" />
              ) : null}
            </div>
            <div className="row-links">
              <RowLink href={p.github} label="GITHUB" />
              {p.live ? <RowLink href={p.live} label="LIVE" /> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Certifications() {
  return (
    <section id="certifications" className="section" tabIndex={-1} aria-labelledby="certifications-label">
      <SectionLabel id="certifications">CERTIFICATIONS</SectionLabel>
      <ul className="rows">
        {certifications.map((c) => (
          <li key={c.title} className="row">
            <div className="row-main">
              <h3 className="row-head">
                <span className="row-title">{c.title}</span>
                {c.date ? <span className="meta">{c.date}</span> : null}
              </h3>
              {c.pill ? <Pills pills={[c.pill]} /> : null}
            </div>
            <div className="row-links">
              <RowLink href={c.href} label={c.issuer} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Footer() {
  return (
    <footer id="contact" className="footer" tabIndex={-1}>
      <h2 className="sr-only">Contact</h2>
      <p className="footer-mark">© 2026 BYJAYSON</p>
      <ul className="footer-icons">
        <li>
          <a href={site.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <Icon name="linkedin" size={20} />
          </a>
        </li>
        <li>
          <a href={site.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <Icon name="github" size={20} />
          </a>
        </li>
        <li>
          <a href={`mailto:${site.email}`} aria-label={`Email ${site.email}`}>
            <Icon name="mail" size={20} />
          </a>
        </li>
      </ul>
    </footer>
  );
}
