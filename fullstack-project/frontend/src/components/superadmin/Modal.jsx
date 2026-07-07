import React from "react";
import "../../styles/superadmin.css";

export default function Modal({ title, visible, onClose, children }) {
  if (!visible) return null;
  return (
    <div className="sa-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="sa-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <div className="sa-modal-header">
          <h3>{title}</h3>
          <button className="sa-btn sa-btn-ghost" onClick={onClose} aria-label="Close" type="button">Close</button>
        </div>
        <div className="sa-modal-body">{children}</div>
      </section>
    </div>
  );
}
