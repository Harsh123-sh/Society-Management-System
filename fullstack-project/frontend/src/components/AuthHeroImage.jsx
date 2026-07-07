import { useState } from "react";

function AuthFallbackVisual({ type = "login" }) {
  return (
    <div className={`auth-v2-fallback auth-v2-fallback--${type}`} aria-hidden="true">
      <span className="auth-v2-fallback__ring auth-v2-fallback__ring--one" />
      <span className="auth-v2-fallback__ring auth-v2-fallback__ring--two" />
      <div className="auth-v2-fallback__device">
        <i />
        <b />
        <span />
        <span />
        <span />
      </div>
      <div className="auth-v2-fallback__panel">
        <strong>NEXORA</strong>
        <span />
        <span />
      </div>
    </div>
  );
}

export default function AuthHeroImage({ src, alt, type = "login" }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <AuthFallbackVisual type={type} />;
  }

  return (
    <figure className="auth-v2-hero-media">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        width="1200"
        height="900"
        onError={() => setFailed(true)}
      />
    </figure>
  );
}
