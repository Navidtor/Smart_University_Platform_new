import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

export const LoginBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number>();
  const targetMouseRef = useRef<MousePosition>({ x: 0.5, y: 0.5 });

  // Floating geometric shapes - elegant and professional
  const shapes = useMemo(() => [
    { id: 1, type: 'circle', x: 12, y: 18, size: 80, rotation: 0, duration: 18, delay: 0, opacity: 0.4 },
    { id: 2, type: 'ring', x: 85, y: 22, size: 60, rotation: 45, duration: 22, delay: 2, opacity: 0.35 },
    { id: 3, type: 'circle', x: 72, y: 75, size: 50, rotation: 0, duration: 20, delay: 4, opacity: 0.3 },
    { id: 4, type: 'ring', x: 18, y: 68, size: 70, rotation: -30, duration: 24, delay: 1, opacity: 0.35 },
    { id: 5, type: 'circle', x: 45, y: 12, size: 40, rotation: 0, duration: 16, delay: 3, opacity: 0.25 },
    { id: 6, type: 'ring', x: 92, y: 55, size: 55, rotation: 60, duration: 26, delay: 5, opacity: 0.3 },
    { id: 7, type: 'dot', x: 8, y: 42, size: 12, rotation: 0, duration: 14, delay: 2, opacity: 0.5 },
    { id: 8, type: 'dot', x: 55, y: 88, size: 10, rotation: 0, duration: 12, delay: 0, opacity: 0.45 },
    { id: 9, type: 'dot', x: 78, y: 38, size: 8, rotation: 0, duration: 15, delay: 3, opacity: 0.4 },
    { id: 10, type: 'dot', x: 32, y: 55, size: 14, rotation: 0, duration: 17, delay: 1, opacity: 0.35 },
  ], []);

  // Smooth mouse tracking - balanced responsiveness
  const animate = useCallback(() => {
    setMousePos(prev => ({
      x: prev.x + (targetMouseRef.current.x - prev.x) * 0.06,
      y: prev.y + (targetMouseRef.current.y - prev.y) * 0.06,
    }));
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    targetMouseRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Parallax calculation
  const getParallax = (factor: number) => ({
    x: (mousePos.x - 0.5) * factor * 50,
    y: (mousePos.y - 0.5) * factor * 50,
  });

  return (
    <div
      ref={containerRef}
      className="login-background"
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'all',
      }}>
      {/* Dynamic gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(
              ellipse 100% 80% at ${40 + mousePos.x * 20}% ${25 + mousePos.y * 20}%,
              rgba(56, 189, 248, 0.12) 0%,
              transparent 55%
            ),
            radial-gradient(
              ellipse 80% 90% at ${60 - mousePos.x * 15}% ${70 - mousePos.y * 15}%,
              rgba(139, 92, 246, 0.1) 0%,
              transparent 50%
            ),
            radial-gradient(
              ellipse 60% 60% at 80% 20%,
              rgba(14, 165, 233, 0.06) 0%,
              transparent 45%
            ),
            var(--bg-gradient, radial-gradient(ellipse at top, #1e293b 0%, #0a0f1a 50%, #020617 100%))
          `,
          transition: 'background 0.8s ease-out',
        }} />
      {/* Mesh gradient overlay */}
      <div className="mesh-gradient" />
      {/* Subtle grid pattern */}
      <div
        className="grid-pattern left-[51px] top-[69px]"
        style={{
          transform: `translate(${(mousePos.x - 0.5) * 12}px, ${(mousePos.y - 0.5) * 12}px)`,
        }} />
      {/* Floating geometric shapes */}
      <div className="shapes-container">
        {shapes.map((shape) => {
          const parallax = getParallax(0.02 + shape.id * 0.008);
          return (
            <div
              key={shape.id}
              className={`floating-shape shape-${shape.type}`}
              style={{
                left: `${shape.x}%`,
                top: `${shape.y}%`,
                width: shape.size,
                height: shape.size,
                opacity: shape.opacity,
                transform: `
                  translate(calc(-50% + ${parallax.x}px), calc(-50% + ${parallax.y}px))
                  rotate(${shape.rotation}deg)
                `,
                animationDuration: `${shape.duration}s`,
                animationDelay: `${shape.delay}s`,
              }} />
          );
        })}
      </div>
      {/* Elegant flowing curves SVG */}
      <svg className="curves-svg" viewBox="0 0 1440 800" preserveAspectRatio="none">
        <defs>
          <linearGradient id="curveGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent, #38bdf8)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--accent, #38bdf8)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--accent, #38bdf8)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="curveGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0)" stopOpacity="0" />
            <stop offset="50%" stopColor="rgba(139, 92, 246, 1)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        <path
          className="flowing-curve curve-1"
          stroke="url(#curveGradient1)"
          strokeWidth="1.5"
          fill="none"
          style={{
            transform: `translateY(${(mousePos.y - 0.5) * 30}px)`,
          }} />
        <path
          className="flowing-curve curve-2"
          stroke="url(#curveGradient2)"
          strokeWidth="1"
          fill="none"
          style={{
            transform: `translateY(${(mousePos.y - 0.5) * -20}px)`,
          }} />
      </svg>
      {/* Soft ambient glow following cursor */}
      <div
        className="cursor-glow"
        style={{
          left: `${mousePos.x * 100}%`,
          top: `${mousePos.y * 100}%`,
        }} />
      {/* Gradient orbs - professional and subtle */}
      <div className="gradient-orbs">
        <div
          className="gradient-orb orb-primary"
          style={{
            transform: `translate(${(mousePos.x - 0.5) * 40}px, ${(mousePos.y - 0.5) * 30}px)`,
          }} />
        <div
          className="gradient-orb orb-secondary"
          style={{
            transform: `translate(${(mousePos.x - 0.5) * -30}px, ${(mousePos.y - 0.5) * 40}px)`,
          }} />
        <div
          className="gradient-orb orb-accent"
          style={{
            transform: `translate(${(mousePos.x - 0.5) * 25}px, ${(mousePos.y - 0.5) * -35}px)`,
          }} />
      </div>
      {/* Soft vignette */}
      <div className="vignette" />
      {/* CSS Styles */}
      <style>{`
        /* Mesh gradient - premium look */
        .mesh-gradient {
          position: absolute;
          inset: 0;
          background: 
            conic-gradient(from 180deg at 50% 70%, 
              rgba(56, 189, 248, 0) 0deg,
              rgba(56, 189, 248, 0.03) 60deg,
              rgba(139, 92, 246, 0.03) 120deg,
              rgba(56, 189, 248, 0) 180deg,
              rgba(139, 92, 246, 0.02) 240deg,
              rgba(56, 189, 248, 0.02) 300deg,
              rgba(56, 189, 248, 0) 360deg
            );
          animation: meshRotate 60s linear infinite;
          opacity: 0.8;
        }

        @keyframes meshRotate {
          from { transform: rotate(0deg) scale(1.5); }
          to { transform: rotate(360deg) scale(1.5); }
        }

        /* Grid pattern */
        .grid-pattern {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(var(--border, rgba(148, 163, 184, 0.06)) 1px, transparent 1px),
            linear-gradient(90deg, var(--border, rgba(148, 163, 184, 0.06)) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
          transition: transform 0.8s ease-out;
        }

        /* Floating shapes container */
        .shapes-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        /* Shape styles */
        .floating-shape {
          position: absolute;
          transition: transform 0.6s ease-out;
          will-change: transform;
        }

        .shape-circle {
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, 
            var(--accent, rgba(56, 189, 248, 0.4)) 0%, 
            var(--accent, rgba(56, 189, 248, 0.1)) 50%,
            transparent 70%
          );
          animation: floatGentle ease-in-out infinite;
        }

        .shape-ring {
          border-radius: 50%;
          border: 1.5px solid var(--accent, rgba(56, 189, 248, 0.3));
          background: transparent;
          animation: floatAndRotate ease-in-out infinite;
        }

        .shape-dot {
          border-radius: 50%;
          background: var(--accent, rgba(56, 189, 248, 0.6));
          box-shadow: 0 0 20px var(--accent, rgba(56, 189, 248, 0.3));
          animation: floatSmall ease-in-out infinite;
        }

        @keyframes floatGentle {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-20px); }
        }

        @keyframes floatAndRotate {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg) translateY(0); }
          50% { transform: translate(-50%, -50%) rotate(180deg) translateY(-15px); }
        }

        @keyframes floatSmall {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.2) translateY(-10px); }
        }

        /* Flowing curves SVG */
        .curves-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .flowing-curve {
          transition: transform 1s ease-out;
        }

        .curve-1 {
          d: path("M-100,400 Q200,350 400,400 T800,380 T1200,420 T1540,400");
          animation: flowCurve1 15s ease-in-out infinite;
        }

        .curve-2 {
          d: path("M-100,500 Q300,450 500,500 T900,480 T1300,520 T1540,500");
          animation: flowCurve2 18s ease-in-out infinite;
        }

        @keyframes flowCurve1 {
          0%, 100% { d: path("M-100,400 Q200,350 400,400 T800,380 T1200,420 T1540,400"); }
          50% { d: path("M-100,400 Q200,450 400,400 T800,420 T1200,380 T1540,400"); }
        }

        @keyframes flowCurve2 {
          0%, 100% { d: path("M-100,500 Q300,450 500,500 T900,480 T1300,520 T1540,500"); }
          50% { d: path("M-100,500 Q300,550 500,500 T900,520 T1300,480 T1540,500"); }
        }

        /* Cursor glow */
        .cursor-glow {
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, 
            var(--accent-soft, rgba(56, 189, 248, 0.12)) 0%, 
            transparent 60%
          );
          transform: translate(-50%, -50%);
          pointer-events: none;
          filter: blur(30px);
          transition: left 0.3s ease-out, top 0.3s ease-out;
        }

        /* Gradient orbs */
        .gradient-orbs {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          transition: transform 1.2s ease-out;
        }

        .orb-primary {
          top: 10%;
          left: 15%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%);
          animation: orbDrift1 25s ease-in-out infinite;
        }

        .orb-secondary {
          top: 50%;
          right: 10%;
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%);
          animation: orbDrift2 30s ease-in-out infinite;
        }

        .orb-accent {
          bottom: 15%;
          left: 30%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%);
          animation: orbDrift3 28s ease-in-out infinite;
        }

        @keyframes orbDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 30px) scale(0.98); }
        }

        @keyframes orbDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 25px) scale(1.03); }
        }

        @keyframes orbDrift3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(25px, -30px) scale(1.02); }
        }

        /* Vignette */
        .vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.25) 100%);
          pointer-events: none;
        }

        /* Light theme adjustments */
        [data-theme="light"] .mesh-gradient {
          background: 
            conic-gradient(from 180deg at 50% 70%, 
              rgba(2, 132, 199, 0) 0deg,
              rgba(2, 132, 199, 0.03) 60deg,
              rgba(79, 70, 229, 0.03) 120deg,
              rgba(2, 132, 199, 0) 180deg,
              rgba(79, 70, 229, 0.02) 240deg,
              rgba(2, 132, 199, 0.02) 300deg,
              rgba(2, 132, 199, 0) 360deg
            );
        }

        [data-theme="light"] .shape-circle {
          background: radial-gradient(circle at 30% 30%, 
            rgba(2, 132, 199, 0.3) 0%, 
            rgba(2, 132, 199, 0.08) 50%,
            transparent 70%
          );
        }

        [data-theme="light"] .shape-ring {
          border-color: rgba(2, 132, 199, 0.25);
        }

        [data-theme="light"] .shape-dot {
          background: rgba(2, 132, 199, 0.5);
          box-shadow: 0 0 20px rgba(2, 132, 199, 0.2);
        }

        [data-theme="light"] .orb-primary {
          background: radial-gradient(circle, rgba(2, 132, 199, 0.08) 0%, transparent 70%);
        }

        [data-theme="light"] .orb-secondary {
          background: radial-gradient(circle, rgba(79, 70, 229, 0.06) 0%, transparent 70%);
        }

        [data-theme="light"] .orb-accent {
          background: radial-gradient(circle, rgba(14, 165, 233, 0.05) 0%, transparent 70%);
        }

        [data-theme="light"] .cursor-glow {
          background: radial-gradient(circle, 
            rgba(2, 132, 199, 0.08) 0%, 
            transparent 60%
          );
        }

        [data-theme="light"] .vignette {
          background: radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.08) 100%);
        }
      `}</style>
    </div>
  );
};
