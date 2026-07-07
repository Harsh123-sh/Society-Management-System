import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BRAND } from "../config/brand";

function LogoContent({ variant = "full", className = "" }) {
  const showText = variant !== "icon";

  return (
    <span className={`brand-logo brand-logo--${variant} ${className}`}>
      <span className="brand-logo__mark">
        <img src={BRAND.logo} alt="" />
      </span>
      {showText && (
        <span className="brand-logo__text">
          <strong>{BRAND.name}</strong>
          {variant === "full" && <em>{BRAND.tagline}</em>}
        </span>
      )}
    </span>
  );
}

export default function BrandLogo({ to = "/", variant = "full", animated = true, className = "" }) {
  const content = <LogoContent variant={variant} className={className} />;

  const inner = animated ? (
    <motion.span
      className="brand-logo__motion"
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {content}
    </motion.span>
  ) : (
    content
  );

  if (!to) return inner;

  return (
    <Link to={to} className="brand-logo-link" aria-label={`${BRAND.name} home`}>
      {inner}
    </Link>
  );
}
