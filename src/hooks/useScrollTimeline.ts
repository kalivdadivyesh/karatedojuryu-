import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface ScrollPhase {
  progress: number;       // 0-1 overall
  drawProgress: number;   // 0-1 blade reveal (0%-30%)
  spinProgress: number;   // 0-1 spin (30%-50%)
  slashProgress: number;  // 0-1 slash (50%-65%)
  endProgress: number;    // 0-1 end state (65%-100%)
}

export function useScrollTimeline(): ScrollPhase {
  const [phase, setPhase] = useState<ScrollPhase>({
    progress: 0,
    drawProgress: 0,
    spinProgress: 0,
    slashProgress: 0,
    endProgress: 0,
  });

  const rafRef = useRef(0);

  useEffect(() => {
    const update = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, scrollY / maxScroll));

      // Map scroll ranges to phases
      const draw = gsap.utils.clamp(0, 1, gsap.utils.mapRange(0, 0.3, 0, 1, p));
      const spin = gsap.utils.clamp(0, 1, gsap.utils.mapRange(0.3, 0.5, 0, 1, p));
      const slash = gsap.utils.clamp(0, 1, gsap.utils.mapRange(0.5, 0.65, 0, 1, p));
      const end = gsap.utils.clamp(0, 1, gsap.utils.mapRange(0.65, 1, 0, 1, p));

      setPhase({ progress: p, drawProgress: draw, spinProgress: spin, slashProgress: slash, endProgress: end });
    };

    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);

  return phase;
}
