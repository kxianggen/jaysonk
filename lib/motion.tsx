"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Motion on/off for the whole page. The starting value is set before first paint by the
// inline script in app/layout.tsx (saved choice, else the system reduced-motion setting),
// so CSS can read <html data-motion="on|off"> without a flash.
type Ctx = { motion: boolean; setMotion: (on: boolean) => void };
const MotionContext = createContext<Ctx>({ motion: true, setMotion: () => {} });

export const motionScript = `(function(){try{var s=localStorage.getItem('motion');var on=s?s==='on':!matchMedia('(prefers-reduced-motion: reduce)').matches;document.documentElement.dataset.motion=on?'on':'off';}catch(e){document.documentElement.dataset.motion='on';}})();`;

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [motion, setState] = useState(true);

  useEffect(() => {
    setState(document.documentElement.dataset.motion !== "off");
  }, []);

  const setMotion = useCallback((on: boolean) => {
    setState(on);
    document.documentElement.dataset.motion = on ? "on" : "off";
    try {
      localStorage.setItem("motion", on ? "on" : "off");
    } catch {
      /* private mode: choice lasts for this visit only */
    }
  }, []);

  return <MotionContext.Provider value={{ motion, setMotion }}>{children}</MotionContext.Provider>;
}

export const useMotion = () => useContext(MotionContext);
