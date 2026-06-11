import { Link } from "react-router-dom";

export default function AuthLink({ to, children, className = "", ...props }) {
  return (
    <Link to={to} className={`auth-link ${className}`} {...props}>
      {children}
    </Link>
  );
}
