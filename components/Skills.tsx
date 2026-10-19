"use client";

import { useRef, useState } from "react";
import { skillFolders } from "@/lib/content";
import { useMotion } from "@/lib/motion";
import { Icon } from "./Icon";

// Two "app folder" tiles. Clicking one zooms it into a centred panel (a native <dialog>, so
// focus stays inside, Esc closes it and the page behind is inert) over a blurred page.
export default function Skills() {
  const { motion } = useMotion();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const folder = skillFolders.find((f) => f.id === openId);

  // Animate the panel from the tile's position to the centre (and back on close).
  const zoom = (dialog: HTMLElement, tile: HTMLElement, reverse: boolean) => {
    const d = dialog.getBoundingClientRect();
    const t = tile.getBoundingClientRect();
    const from = `translate(${t.left + t.width / 2 - (d.left + d.width / 2)}px, ${
      t.top + t.height / 2 - (d.top + d.height / 2)
    }px) scale(${t.width / d.width})`;
    const frames = [
      { transform: from, opacity: 0.4 },
      { transform: "none", opacity: 1 },
    ];
    return dialog.animate(reverse ? frames.reverse() : frames, {
      duration: reverse ? 200 : 260,
      easing: "cubic-bezier(.2,.8,.2,1)",
    });
  };

  const open = (id: string, tile: HTMLButtonElement) => {
    openerRef.current = tile;
    setOpenId(id);
    requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      dialog.showModal();
      dialog.scrollTop = 0;
      if (motion) zoom(dialog, tile, false);
    });
  };

  const close = () => {
    const dialog = dialogRef.current;
    const tile = openerRef.current;
    if (!dialog || !dialog.open) return;
    const finish = () => {
      dialog.close();
      setOpenId(null);
    };
    if (motion && tile) zoom(dialog, tile, true).finished.then(finish, finish);
    else finish();
  };

  return (
    <section id="skills" className="section" tabIndex={-1} aria-labelledby="skills-label">
      <h2 className="label" id="skills-label">
        SKILLS
      </h2>
      <div className="folders">
        {skillFolders.map((f) => (
          <div key={f.id} className="folder">
            <button
              type="button"
              className="folder-tile"
              aria-haspopup="dialog"
              aria-label={`${f.name}: ${f.items.length} skills. Open the list`}
              onClick={(e) => open(f.id, e.currentTarget)}
            >
              {f.tile.slice(0, 3).map((name) => (
                <span key={name} className="app app-big">
                  <Icon name={name} size={30} />
                </span>
              ))}
              <span className="app-mini-grid">
                {f.tile.slice(3, 7).map((name) => (
                  <span key={name} className="app app-mini">
                    <Icon name={name} size={14} />
                  </span>
                ))}
              </span>
            </button>
            <p className="folder-name" aria-hidden="true">
              {f.name} <span className="meta">{f.items.length}</span>
            </p>
          </div>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className="panel"
        aria-labelledby="panel-title"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          // a click on the dialog element itself = a click on the blurred backdrop
          if (e.target === e.currentTarget) close();
        }}
      >
        {folder ? (
          <div className="panel-inner">
            <div className="panel-head">
              <h3 id="panel-title">{folder.name}</h3>
              <button type="button" className="panel-close" onClick={close} aria-label="Close">
                ×
              </button>
            </div>
            {/* laid out like an opened phone folder: app icon, name, and what kind of thing it is */}
            <ul className="skill-grid">
              {folder.items.map((s) => (
                <li key={s.name} className="skill">
                  <span className="app app-grid" aria-hidden="true">
                    <Icon name={s.icon} size={26} />
                  </span>
                  <span className="skill-name">{s.name}</span>
                  <span className="tag">{s.tag}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}
