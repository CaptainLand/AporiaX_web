import { useRef } from "react";
import MetalButton from "./MetalButton.jsx";
import { useWelcomeEffects } from "./useWelcomeEffects.js";

export default function HeroStage({
  logoUrl,
  title,
  subtitle,
  tags,
  downloadLabel,
  githubLabel,
  downloadUrl,
  githubUrl,
}) {
  const imageRef = useRef(null);
  const plateRef = useRef(null);
  const meshRef = useRef(null);
  const { logoStatus, logoImage, logoPlate, meshOn, cycleLogo } = useWelcomeEffects(imageRef, plateRef, meshRef);

  return (
    <section className="hero" id="top">
      <div className="hero-mesh" ref={meshRef} data-effect={meshOn ? "animated" : "static"} aria-hidden="true" />
      <div className="hero-content page-width hero-content--welcome">
        <div className="hero-copy">
          <ul className="hero-kicker">
            {tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
          <h1>Aporia<span>X</span></h1>
          <p className="hero-subtitle">{subtitle}</p>
          <div className="hero-actions">
            <MetalButton className="button button--primary" href={downloadUrl} target="_blank" rel="noreferrer">
              <span>{downloadLabel}</span>
              <span aria-hidden="true">↗</span>
            </MetalButton>
            <a className="button button--quiet" href={githubUrl} target="_blank" rel="noreferrer">{githubLabel}<span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <button
          className="hero-art"
          type="button"
          data-effect={logoStatus}
          data-image={logoImage ? "" : undefined}
          data-plate={logoPlate ? "" : undefined}
          onClick={cycleLogo}
          aria-label={title}
        >
          <div className="hero-art-halo" aria-hidden="true" />
          <img className="hero-art-original" src={logoUrl} alt="" width="1254" height="1254" draggable="false" />
          <div className="hero-art-shader" ref={imageRef} aria-hidden="true" />
          <div className="hero-art-plate" ref={plateRef} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
