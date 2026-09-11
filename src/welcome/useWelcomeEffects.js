import { useCallback, useEffect, useRef, useState } from "react";

function afterPaint(fn) {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}

export function useWelcomeEffects(imageRef, plateRef, meshRef) {
  const [logoStatus, setLogoStatus] = useState("static");
  const [logoImage, setLogoImage] = useState(false);
  const [logoPlate, setLogoPlate] = useState(false);
  const [meshOn, setMeshOn] = useState(false);
  const cycleRef = useRef({
    index: 0,
    generation: 0,
    logoGen: 0,
    logoDispose: null,
    pending: null,
    assets: null,
    mod: null,
  });

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const state = cycleRef.current;
    let extras = [];
    const hideLayers = () => {
      setLogoImage(false);
      setLogoPlate(false);
    };
    const reveal = (kind, outgoing) => {
      if (kind === "masked") setLogoPlate(true);
      else setLogoImage(true);
      setLogoStatus("animated");
      afterPaint(() => {
        if (kind === "masked") setLogoImage(false);
        else setLogoPlate(false);
        afterPaint(() => outgoing?.());
      });
    };
    const clearLogo = () => {
      state.pending?.();
      state.pending = null;
      state.logoDispose?.();
      state.logoDispose = null;
    };
    const clearAll = () => {
      clearLogo();
      for (const dispose of extras) dispose?.();
      extras = [];
    };
    const mountLogo = (index, generation) => {
      const mod = state.mod;
      if (!mod) return;
      const effect = mod.LOGO_CYCLE[index];
      const host = effect.kind === "masked" ? plateRef.current : imageRef.current;
      if (!host) return;
      const logoGen = ++state.logoGen;
      state.pending?.();
      const incoming = mod.mountLogoEffect(host, effect, state.assets, {
        onReady: () => {
          if (generation !== state.generation || logoGen !== state.logoGen) {
            incoming();
            return;
          }
          const outgoing = state.logoDispose;
          state.logoDispose = incoming;
          state.pending = null;
          reveal(effect.kind, outgoing);
        },
        onError: (error) => {
          if (generation !== state.generation || logoGen !== state.logoGen) return;
          if (state.pending === incoming) state.pending = null;
          if (state.logoDispose && state.logoDispose !== incoming) return;
          state.logoDispose = null;
          hideLayers();
          if (index === 0) {
            console.warn("AporiaX welcome: using static logo.", error);
            setLogoStatus("fallback");
          } else {
            setLogoStatus("static");
          }
        },
      });
      state.pending = incoming;
    };
    const update = () => {
      const generation = ++state.generation;
      clearAll();
      state.index = 0;
      state.logoGen = 0;
      setLogoStatus("static");
      hideLayers();
      setMeshOn(false);
      if (motion.matches) return;
      void import("./welcome-effects.js").then(async (mod) => {
        if (generation !== state.generation) return;
        state.mod = mod;
        state.assets = await mod.loadLogoCycleAssets();
        if (generation !== state.generation) return;
        mountLogo(0, generation);
        if (meshRef?.current) {
          extras.push(mod.mountMeshFlow(meshRef.current, {
            onReady: () => { if (generation === state.generation) setMeshOn(true); },
            onError: () => {},
          }));
        }
      }).catch((error) => {
        if (generation !== state.generation) return;
        console.warn("AporiaX welcome: animation unavailable.", error);
        setLogoStatus("fallback");
      });
    };
    update();
    motion.addEventListener("change", update);
    return () => {
      state.generation += 1;
      motion.removeEventListener("change", update);
      clearAll();
    };
  }, [imageRef, plateRef, meshRef]);

  const cycleLogo = useCallback(() => {
    const state = cycleRef.current;
    if (!state.mod || !state.assets) return;
    state.index = (state.index + 1) % state.mod.LOGO_CYCLE.length;
    const effect = state.mod.LOGO_CYCLE[state.index];
    const host = effect.kind === "masked" ? plateRef.current : imageRef.current;
    if (!host) return;
    const generation = state.generation;
    const logoGen = ++state.logoGen;
    state.pending?.();
    const incoming = state.mod.mountLogoEffect(host, effect, state.assets, {
      onReady: () => {
        if (generation !== state.generation || logoGen !== state.logoGen) {
          incoming();
          return;
        }
        const outgoing = state.logoDispose;
        state.logoDispose = incoming;
        state.pending = null;
        if (effect.kind === "masked") setLogoPlate(true);
        else setLogoImage(true);
        setLogoStatus("animated");
        afterPaint(() => {
          if (effect.kind === "masked") setLogoImage(false);
          else setLogoPlate(false);
          afterPaint(() => outgoing?.());
        });
      },
      onError: () => {
        if (generation !== state.generation || logoGen !== state.logoGen) return;
        if (state.pending === incoming) state.pending = null;
        if (state.logoDispose && state.logoDispose !== incoming) return;
        state.logoDispose = null;
        setLogoImage(false);
        setLogoPlate(false);
        setLogoStatus("static");
      },
    });
    state.pending = incoming;
  }, [imageRef, plateRef]);

  return { logoStatus, logoImage, logoPlate, meshOn, cycleLogo };
}
