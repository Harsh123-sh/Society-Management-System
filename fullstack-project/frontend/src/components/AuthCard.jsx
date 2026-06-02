import GlassCard from "./GlassCard";

export default function AuthCard({ children, className = "" }) {
  return (
    <GlassCard className={`auth-card ${className}`}>
      {children}
    </GlassCard>
  );
}
