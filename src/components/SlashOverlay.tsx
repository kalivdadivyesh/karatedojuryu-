import { useEffect, useRef, useState } from "react";

export default function SlashOverlay() {
  const [slashProgress, setSlashProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, y / max));
      const slash = Math.max(0, Math.min(1, (p - 0.5) / 0.15));
      setSlashProgress(slash);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth * 2;
    canvas.height = window.innerHeight * 2;
    ctx.scale(2, 2);

    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    if (slashProgress <= 0.05 || slashProgress >= 0.95) return;

    // Main slash line
    const slashEase = 1 - Math.pow(1 - slashProgress, 3);
    const opacity = slashProgress < 0.3 ? slashProgress * 3.33 : (1 - slashProgress) * 1.43;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity)) * 0.9;

    // Diagonal slash from top-right to bottom-left
    const startX = w * 0.8;
    const startY = h * 0.1;
    const endX = w * 0.2 - slashEase * w * 0.3;
    const endY = h * 0.9;

    const currentX = startX + (endX - startX) * slashEase;
    const currentY = startY + (endY - startY) * slashEase;

    // Glow
    const grad = ctx.createLinearGradient(startX, startY, currentX, currentY);
    grad.addColorStop(0, "rgba(255, 50, 50, 0)");
    grad.addColorStop(0.3, "rgba(255, 80, 40, 0.8)");
    grad.addColorStop(0.6, "rgba(255, 255, 255, 0.9)");
    grad.addColorStop(1, "rgba(255, 50, 50, 0)");

    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(255, 50, 50, 0.8)";
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    // Thinner white core
    ctx.shadowBlur = 15;
    ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();

    ctx.restore();
  }, [slashProgress]);

  if (slashProgress <= 0.02) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-30 pointer-events-none"
      style={{
        width: "100vw",
        height: "100vh",
        mixBlendMode: "screen",
      }}
    />
  );
}
