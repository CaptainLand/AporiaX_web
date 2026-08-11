import { useEffect, useRef } from "react";

const TAU = Math.PI * 2;

function createPoints() {
  const points = [];
  const columns = 56;
  const rows = 27;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = (column / (columns - 1) - 0.5) * 2;
      const z = row / (rows - 1);
      const jitter = ((column * 19 + row * 31) % 17) / 17 - 0.5;
      points.push({ x, z, jitter });
    }
  }

  return points;
}

export default function ParticleSea() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d", { alpha: true });
    const points = createPoints();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let width = 1;
    let height = 1;
    let dpr = 1;
    let animationFrame = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onPointerMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const onPointerLeave = () => {
      pointer.targetX = 0;
      pointer.targetY = 0;
    };

    const draw = (timestamp = 0) => {
      const time = reducedMotion.matches ? 2.4 : timestamp * 0.00024;
      pointer.x += (pointer.targetX - pointer.x) * 0.025;
      pointer.y += (pointer.targetY - pointer.y) * 0.025;

      context.clearRect(0, 0, width, height);

      const horizonY = height * (0.48 + pointer.y * 0.008);
      const centerX = width * (0.5 + pointer.x * 0.01);
      const floorY = height * 1.03;

      const wash = context.createLinearGradient(0, horizonY - 30, 0, floorY);
      wash.addColorStop(0, "rgba(82, 132, 255, 0.02)");
      wash.addColorStop(0.45, "rgba(91, 98, 212, 0.045)");
      wash.addColorStop(1, "rgba(25, 31, 65, 0)");
      context.fillStyle = wash;
      context.fillRect(0, horizonY - 20, width, floorY - horizonY + 20);

      for (const point of points) {
        const depth = point.z;
        const perspective = 0.1 + Math.pow(depth, 1.75) * 0.94;
        const worldX = point.x + pointer.x * 0.035 * (1 - depth);
        const wave =
          Math.sin(worldX * 4.8 + time * 2.4 + point.z * 2.6) * 0.42 +
          Math.sin(worldX * 9.5 - time * 1.4 + point.z * 5.2) * 0.18 +
          Math.cos(point.z * 8.4 + time + point.jitter) * 0.14;

        const x = centerX + worldX * width * 0.58 * perspective;
        const baseY = horizonY + Math.pow(depth, 2.08) * (floorY - horizonY);
        const y = baseY - wave * (4 + depth * 28) - pointer.y * depth * 4;

        if (x < -16 || x > width + 16 || y < horizonY - 60 || y > height + 20) {
          continue;
        }

        const pulse = 0.78 + Math.sin(time * 3 + point.x * 7 + point.z * 12) * 0.22;
        const alpha = (0.09 + depth * 0.58) * pulse;
        const radius = 0.55 + Math.pow(depth, 1.5) * 1.35;

        context.beginPath();
        context.arc(x, y, radius, 0, TAU);
        context.fillStyle = `rgba(${Math.round(118 + depth * 48)}, ${Math.round(
          162 + depth * 36,
        )}, 255, ${alpha})`;
        context.fill();
      }

      const horizonGlow = context.createLinearGradient(
        centerX - width * 0.32,
        0,
        centerX + width * 0.32,
        0,
      );
      horizonGlow.addColorStop(0, "rgba(93, 127, 255, 0)");
      horizonGlow.addColorStop(0.5, "rgba(117, 151, 255, 0.24)");
      horizonGlow.addColorStop(1, "rgba(93, 127, 255, 0)");
      context.fillStyle = horizonGlow;
      context.fillRect(centerX - width * 0.32, horizonY - 0.5, width * 0.64, 1);

      if (!reducedMotion.matches) {
        animationFrame = requestAnimationFrame(draw);
      }
    };

    resize();
    draw(0);
    if (!reducedMotion.matches) animationFrame = requestAnimationFrame(draw);

    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);

    const onMotionChange = () => {
      cancelAnimationFrame(animationFrame);
      draw(0);
      if (!reducedMotion.matches) animationFrame = requestAnimationFrame(draw);
    };
    reducedMotion.addEventListener?.("change", onMotionChange);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      reducedMotion.removeEventListener?.("change", onMotionChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-sea" aria-hidden="true" />;
}
