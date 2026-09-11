import { useEffect, useRef } from "react";

export default function GemLayer({ className = "" }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let dispose = () => {};
    let cancelled = false;
    void import("./gem-panel.js").then((mod) => {
      if (cancelled || !hostRef.current) return;
      dispose = mod.mountGemPanel(hostRef.current, { onError: () => {} });
    }).catch(() => {});
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return <span className={`gem-layer ${className}`.trim()} ref={hostRef} aria-hidden="true" />;
}
