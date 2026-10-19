"use client";

import { useEffect, useRef, useState } from "react";

// One floating screenshot card for every row that has data-preview (Experience, Projects).
// Mouse: follows the cursor 16 px below-right. Keyboard: sits beside the focused row.
// Touch screens never see it; they get the inline thumbnail instead (CSS).
export default function HoverPreview() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [alt, setAlt] = useState("");

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const card = cardRef.current;
    if (!card) return;
    const W = 300;
    const H = 188;

    const place = (x: number, y: number) => {
      const left = Math.min(x + 16, window.innerWidth - W - 12);
      const top = Math.min(y + 16, window.innerHeight - H - 12);
      card.style.transform = `translate(${left}px, ${top}px)`;
    };

    const rowOf = (t: EventTarget | null) =>
      t instanceof Element ? (t.closest("[data-preview]") as HTMLElement | null) : null;

    let current: HTMLElement | null = null;
    const show = (row: HTMLElement) => {
      if (row === current) return;
      current = row;
      setSrc(row.dataset.preview ?? null);
      setAlt(row.dataset.previewAlt ?? "");
    };
    const hide = () => {
      current = null;
      setSrc(null);
    };

    const onMove = (e: PointerEvent) => {
      if (!fine.matches || e.pointerType !== "mouse") return;
      const row = rowOf(e.target);
      if (!row || !row.dataset.preview) return hide();
      show(row);
      place(e.clientX, e.clientY);
    };
    const onFocus = (e: FocusEvent) => {
      if (!fine.matches) return;
      const row = rowOf(e.target);
      if (!row || !row.dataset.preview) return hide();
      show(row);
      const r = row.getBoundingClientRect();
      const roomRight = window.innerWidth - r.right;
      place(roomRight > W + 32 ? r.right : r.left + 24, roomRight > W + 32 ? r.top - 16 : r.bottom);
    };
    const onLeaveDoc = () => hide();
    const onScroll = () => {
      if (current && document.activeElement && !current.contains(document.activeElement)) hide();
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("focusin", onFocus);
    document.documentElement.addEventListener("pointerleave", onLeaveDoc);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("focusin", onFocus);
      document.documentElement.removeEventListener("pointerleave", onLeaveDoc);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={cardRef} className={`preview-card${src ? " is-on" : ""}`} aria-hidden="true">
      {src ? <img src={src} alt={alt} width={800} height={500} /> : null}
    </div>
  );
}
