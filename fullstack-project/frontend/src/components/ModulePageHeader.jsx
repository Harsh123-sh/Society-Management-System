import "./module-page-header.css";
import { getStoredRole } from "../utils/session";

function ModulePageHeader({ title, subtitle = "", actions = null }) {
  const role = getStoredRole();
  const isLeadership = role === "admin" || role === "secretary";

  if (isLeadership) {
    return actions ? <section className="module-page-shell module-page-shell--actions-only"><div className="module-action-bar">{actions}</div></section> : null;
  }

  return (
    <section className="module-page-shell">
      <div className="module-page-title">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="module-action-bar">{actions}</div> : null}
    </section>
  );
}

export default ModulePageHeader;
