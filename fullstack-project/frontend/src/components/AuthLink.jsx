import { Link } from "react-router-dom";

export default function AuthLink({ to, children, className = "", ...props }) {
  return (
    <Link to={to} className={`font-medium text-cyan-100 transition hover:text-white ${className}`} {...props}>
      {children}
    </Link>
  );
}
