import { useEffect } from "react";

export default function AnimatedBackground() {
  useEffect(() => {
    // simple particle effect using CSS variables could be enhanced later
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="pointer-events-none absolute -left-20 -top-32 h-[520px] w-[520px] animate-blob rounded-full bg-gradient-to-r from-emerald-400/40 via-cyan-300/30 to-indigo-400/30 blur-3xl opacity-80" />
      <div className="pointer-events-none absolute right-[-80px] top-24 h-[360px] w-[360px] animate-blob animation-delay-2000 rounded-full bg-gradient-to-br from-pink-400/30 via-amber-300/20 to-rose-400/20 blur-3xl opacity-70" />
    </div>
  );
}
