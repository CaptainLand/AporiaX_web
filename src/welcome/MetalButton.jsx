import { useEffect, useRef, useState } from "react";

export default function MetalButton({ as, className = "", children, ...props }) {
  const metalRef = useRef(null);
  const [metalOn, setMetalOn] = useState(false);
  const Tag = as || (props.href ? "a" : "button");

  useEffect(() => {
    const host = metalRef.current;
    if (!host || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let dispose = () => {};
    let cancelled = false;
    void import("./liquid-metal.js").then((mod) => {
      if (cancelled || !metalRef.current) return;
      dispose = mod.mountLiquidMetal(metalRef.current, {
        onReady: () => { if (!cancelled) setMetalOn(true); },
        onError: () => {},
      });
    }).catch(() => {});
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return (
    <Tag className={`ax-metal-btn ${className}`.trim()} data-metal={metalOn ? "animated" : "static"} {...props}>
      <span className="ax-metal-btn__layer" ref={metalRef} aria-hidden="true" />
      {children}
    </Tag>
  );
}
