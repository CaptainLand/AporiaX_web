import { gemSmokeFragmentShader, getShaderColorFromString, toProcessedGemSmoke } from "@paper-design/shaders";
import { mountWelcomeShader } from "./paper-loop.js";

let rectTexturePromise;

function loadFillTexture() {
  if (!rectTexturePromise) {
    rectTexturePromise = (async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 512, 512);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      const processed = await toProcessedGemSmoke(new File([blob], "fill.png", { type: "image/png" }));
      const texture = new Image();
      texture.src = URL.createObjectURL(processed.pngBlob);
      await texture.decode();
      return texture;
    })();
  }
  return rectTexturePromise;
}

export function mountGemPanel(host, hooks) {
  const color = getShaderColorFromString;
  return mountWelcomeShader(host, {
    fragmentShader: gemSmokeFragmentShader,
    maxPixels: 160_000,
    mipmaps: ["u_image"],
    startFrame: 1800,
    timeScale: 0.24,
    prepare: async () => {
      const texture = await loadFillTexture();
      return {
        u_image: texture,
        u_isImage: true,
        u_shape: 0,
        u_colors: ["#baeaff", "#4abbed", "#176de2", "#85dfff", "#257bd5", "#baeaff"].map(color),
        u_colorsCount: 5,
        u_colorBack: color("#00000000"),
        u_colorInner: color("#dff3ff"),
        u_innerDistortion: 0.38,
        u_outerDistortion: 0.25,
        u_outerGlow: 0,
        u_innerGlow: 0.96,
        u_offset: 0,
        u_angle: -20,
        u_size: 1,
        u_fit: 2,
        u_scale: 1,
        u_rotation: 0,
        u_offsetX: 0,
        u_offsetY: 0,
        u_originX: 0.5,
        u_originY: 0.5,
        u_worldWidth: 0,
        u_worldHeight: 0,
      };
    },
    ...hooks,
  });
}
