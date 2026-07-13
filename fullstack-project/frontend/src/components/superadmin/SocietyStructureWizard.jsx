import { useEffect, useMemo, useState } from "react";
import { publishSocietyStructure } from "../../services/societyStructureApi";
import { getApiMessage } from "../../services/authApi";

const steps = [
  "Society Overview",
  "Towers Setup",
  "Wings Setup",
  "Floor Setup",
  "Bulk Flat Generator",
  "Gates Setup",
  "Parking Setup",
  "Review & Publish",
];

function emptyTower() {
  return {
    towerName: "",
    towerCode: "",
    description: "",
    wings: [
      {
        wingName: "",
        wingCode: "",
        startFloor: 1,
        endFloor: 3,
        flatsPerFloor: 2,
        flatPrefix: "A",
        residenceType: "Apartment",
      },
    ],
  };
}

function normalizeCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 20);
}

function buildPayload(draft) {
  const towers = (draft.towers || []).map((tower, towerIndex) => {
    const towerName = tower.towerName?.trim() || `Tower ${towerIndex + 1}`;
    const towerCode = normalizeCode(tower.towerCode || towerName);
    const wings = (tower.wings || []).map((wing, wingIndex) => {
      const wingName = wing.wingName?.trim() || `Wing ${wingIndex + 1}`;
      const wingCode = normalizeCode(wing.wingCode || `${towerCode}-${wingIndex + 1}`);
      const startFloor = Math.max(1, Number(wing.startFloor || 1));
      const endFloor = Math.max(startFloor, Number(wing.endFloor || startFloor));
      const totalFloors = endFloor - startFloor + 1;
      return {
        wingName,
        wingCode,
        startFloor,
        totalFloors,
        flatsPerFloor: Math.max(1, Number(wing.flatsPerFloor || 2)),
        prefix: String(wing.flatPrefix || towerCode).toUpperCase(),
        flatType: wing.residenceType || "Apartment",
      };
    });
    return {
      towerName,
      towerCode,
      description: tower.description?.trim() || "",
      wings,
    };
  });

  return {
    structureManagedBy: draft.structureManagedBy || "both",
    structureStatus: "in_progress",
    towers,
    gates: (draft.gates || []).map((gate) => ({
      gateName: gate.gateName?.trim() || "Gate",
      gateNumber: gate.gateNumber?.trim() || `G${String((draft.gates || []).indexOf(gate) + 1).padStart(2, "0")}`,
      gateType: gate.gateType || "main_gate",
    })),
    parking: {
      totalSlots: Math.max(0, Number(draft.parking?.totalSlots || 0)),
    },
  };
}

function SummaryBadge({ label, value }) {
  return (
    <div className="sa-structure-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function SocietyStructureWizard({ society, onClose, onSaved }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({
    structureManagedBy: "both",
    towers: [emptyTower()],
    gates: [{ gateName: "Main Gate", gateNumber: "G01", gateType: "main_gate" }],
    parking: { totalSlots: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!society) return;
    setDraft((current) => ({
      ...current,
      towers: current.towers?.length ? current.towers : [emptyTower()],
      gates: current.gates?.length ? current.gates : [{ gateName: "Main Gate", gateNumber: "G01", gateType: "main_gate" }],
      parking: current.parking || { totalSlots: 0 },
    }));
  }, [society]);

  const summary = useMemo(() => {
    const towers = draft.towers?.length || 0;
    const wings = (draft.towers || []).reduce((acc, tower) => acc + (tower.wings?.length || 0), 0);
    const floors = (draft.towers || []).reduce((acc, tower) => acc + (tower.wings || []).reduce((inside, wing) => {
      const start = Math.max(1, Number(wing.startFloor || 1));
      const end = Math.max(start, Number(wing.endFloor || start));
      return inside + (end - start + 1);
    }, 0), 0);
    const flats = (draft.towers || []).reduce((acc, tower) => acc + (tower.wings || []).reduce((inside, wing) => {
      const start = Math.max(1, Number(wing.startFloor || 1));
      const end = Math.max(start, Number(wing.endFloor || start));
      const floorsCount = end - start + 1;
      return inside + floorsCount * Math.max(1, Number(wing.flatsPerFloor || 2));
    }, 0), 0);
    const gates = draft.gates?.length || 0;
    const parking = Number(draft.parking?.totalSlots || 0);
    return { towers, wings, floors, flats, gates, parking };
  }, [draft]);

  function updateDraft(path, value) {
    setDraft((current) => {
      const next = JSON.parse(JSON.stringify(current));
      const segments = path.split(".");
      let target = next;
      segments.slice(0, -1).forEach((segment) => {
        target = target[segment];
      });
      target[segments[segments.length - 1]] = value;
      return next;
    });
  }

  function updateTower(index, field, value) {
    setDraft((current) => ({
      ...current,
      towers: current.towers.map((tower, towerIndex) => towerIndex === index ? { ...tower, [field]: value } : tower),
    }));
  }

  function updateWing(towerIndex, wingIndex, field, value) {
    setDraft((current) => ({
      ...current,
      towers: current.towers.map((tower, currentTowerIndex) => currentTowerIndex === towerIndex ? {
        ...tower,
        wings: tower.wings.map((wing, currentWingIndex) => currentWingIndex === wingIndex ? { ...wing, [field]: value } : wing),
      } : tower),
    }));
  }

  function addTower() {
    setDraft((current) => ({ ...current, towers: [...(current.towers || []), emptyTower()] }));
  }

  function addWing(towerIndex) {
    setDraft((current) => ({
      ...current,
      towers: current.towers.map((tower, currentTowerIndex) => currentTowerIndex === towerIndex ? {
        ...tower,
        wings: [...(tower.wings || []), { wingName: "", wingCode: "", startFloor: 1, endFloor: 3, flatsPerFloor: 2, flatPrefix: "A", residenceType: "Apartment" }],
      } : tower),
    }));
  }

  function addGate() {
    setDraft((current) => ({
      ...current,
      gates: [...(current.gates || []), { gateName: "New Gate", gateNumber: `G${String((current.gates || []).length + 1).padStart(2, "0")}`, gateType: "visitor_gate" }],
    }));
  }

  async function publish() {
    if (!society?.id) {
      setFeedback({ type: "error", message: "Select a society before publishing structure." });
      return;
    }
    setLoading(true);
    setFeedback({ type: "", message: "" });
    try {
      const payload = buildPayload(draft);
      await publishSocietyStructure(society.id, payload);
      setFeedback({ type: "success", message: "Society structure published successfully." });
      if (onSaved) onSaved();
    } catch (error) {
      setFeedback({ type: "error", message: getApiMessage(error, "Unable to publish society structure.") });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sa-structure-wizard">
      <div className="sa-structure-header">
        <div>
          <p className="sa-eyebrow">Society Structure Wizard</p>
          <h3>{society?.society_name || society?.name || "Society"}</h3>
          <p>Create towers, wings, floors, flats, gates, parking, and publish the foundation for all future modules.</p>
        </div>
        <button type="button" className="sa-btn sa-btn-ghost" onClick={onClose}>Close</button>
      </div>

      <div className="sa-structure-stepper">
        {steps.map((label, index) => (
          <button key={label} type="button" className={`sa-structure-step ${index === step ? "active" : ""}`} onClick={() => setStep(index)}>
            <span>{index + 1}</span>
            <strong>{label}</strong>
          </button>
        ))}
      </div>

      {feedback.message ? <div className={`sa-feedback ${feedback.type}`}>{feedback.message}</div> : null}

      {step === 0 ? (
        <section className="sa-structure-panel">
          <h4>Society Overview</h4>
          <p>Capture the base identity for the master structure.</p>
          <div className="sa-form sa-form-grid">
            <label>Society Name<input value={society?.society_name || society?.name || ""} disabled /></label>
            <label>Structure Managed By<select value={draft.structureManagedBy} onChange={(event) => updateDraft("structureManagedBy", event.target.value)}>
              <option value="both">Both</option>
              <option value="super_admin_only">Super Admin Only</option>
              <option value="chairman_only">Chairman Only</option>
            </select></label>
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="sa-structure-panel">
          <div className="sa-structure-panel-head">
            <div>
              <h4>Towers Setup</h4>
              <p>Add one or more towers to define the physical footprint.</p>
            </div>
            <button type="button" className="sa-btn" onClick={addTower}>Add Tower</button>
          </div>
          <div className="sa-structure-stack">
            {(draft.towers || []).map((tower, index) => (
              <div key={`${tower.towerName || "tower"}-${index}`} className="sa-structure-card">
                <div className="sa-structure-card-head">
                  <strong>Tower {index + 1}</strong>
                </div>
                <div className="sa-form sa-form-grid">
                  <label>Tower Name<input value={tower.towerName} onChange={(event) => updateTower(index, "towerName", event.target.value)} placeholder="A Block" /></label>
                  <label>Tower Code<input value={tower.towerCode} onChange={(event) => updateTower(index, "towerCode", normalizeCode(event.target.value))} placeholder="A" /></label>
                  <label className="sa-form-wide">Description<textarea value={tower.description} onChange={(event) => updateTower(index, "description", event.target.value)} rows={3} placeholder="Short description" /></label>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="sa-structure-panel">
          <div className="sa-structure-panel-head">
            <div>
              <h4>Wings Setup</h4>
              <p>Attach wings to each tower for better internal organization.</p>
            </div>
          </div>
          <div className="sa-structure-stack">
            {(draft.towers || []).map((tower, towerIndex) => (
              <div key={`tower-wings-${towerIndex}`} className="sa-structure-card">
                <div className="sa-structure-card-head">
                  <strong>{tower.towerName || `Tower ${towerIndex + 1}`}</strong>
                  <button type="button" className="sa-btn sa-btn-ghost" onClick={() => addWing(towerIndex)}>Add Wing</button>
                </div>
                {(tower.wings || []).map((wing, wingIndex) => (
                  <div key={`wing-${towerIndex}-${wingIndex}`} className="sa-structure-subcard">
                    <div className="sa-form sa-form-grid">
                      <label>Wing Name<input value={wing.wingName} onChange={(event) => updateWing(towerIndex, wingIndex, "wingName", event.target.value)} placeholder="Wing A" /></label>
                      <label>Wing Code<input value={wing.wingCode} onChange={(event) => updateWing(towerIndex, wingIndex, "wingCode", normalizeCode(event.target.value))} placeholder="A" /></label>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="sa-structure-panel">
          <div className="sa-structure-panel-head">
            <div>
              <h4>Floor Setup</h4>
              <p>Define the floor range for each wing and the wizard will generate the floor records automatically.</p>
            </div>
          </div>
          <div className="sa-structure-stack">
            {(draft.towers || []).map((tower, towerIndex) =>
              (tower.wings || []).map((wing, wingIndex) => (
                <div key={`floor-${towerIndex}-${wingIndex}`} className="sa-structure-card">
                  <div className="sa-structure-card-head">
                    <strong>{tower.towerName || `Tower ${towerIndex + 1}`} / {wing.wingName || `Wing ${wingIndex + 1}`}</strong>
                  </div>
                  <div className="sa-form sa-form-grid">
                    <label>Start Floor<input type="number" min="1" value={wing.startFloor} onChange={(event) => updateWing(towerIndex, wingIndex, "startFloor", event.target.value)} /></label>
                    <label>End Floor<input type="number" min="1" value={wing.endFloor} onChange={(event) => updateWing(towerIndex, wingIndex, "endFloor", event.target.value)} /></label>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="sa-structure-panel">
          <div className="sa-structure-panel-head">
            <div>
              <h4>Bulk Flat Generator</h4>
              <p>Preview the flat numbering pattern before publishing.</p>
            </div>
          </div>
          <div className="sa-structure-stack">
            {(draft.towers || []).map((tower, towerIndex) =>
              (tower.wings || []).map((wing, wingIndex) => (
                <div key={`flat-${towerIndex}-${wingIndex}`} className="sa-structure-card">
                  <div className="sa-structure-card-head">
                    <strong>{tower.towerName || `Tower ${towerIndex + 1}`} / {wing.wingName || `Wing ${wingIndex + 1}`}</strong>
                  </div>
                  <div className="sa-form sa-form-grid">
                    <label>Flats Per Floor<input type="number" min="1" value={wing.flatsPerFloor} onChange={(event) => updateWing(towerIndex, wingIndex, "flatsPerFloor", event.target.value)} /></label>
                    <label>Flat Prefix<input value={wing.flatPrefix} onChange={(event) => updateWing(towerIndex, wingIndex, "flatPrefix", event.target.value.toUpperCase())} /></label>
                    <label>Residence Type<select value={wing.residenceType || "Apartment"} onChange={(event) => updateWing(towerIndex, wingIndex, "residenceType", event.target.value)}>
                      <option>Apartment</option>
                      <option>Villa</option>
                      <option>Duplex</option>
                      <option>Penthouse</option>
                      <option>Studio</option>
                      <option>Commercial Shop</option>
                      <option>Office</option>
                    </select></label>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="sa-structure-panel">
          <div className="sa-structure-panel-head">
            <div>
              <h4>Gates Setup</h4>
              <p>Define the access points that will be used by visitors and residents.</p>
            </div>
            <button type="button" className="sa-btn" onClick={addGate}>Add Gate</button>
          </div>
          <div className="sa-structure-stack">
            {(draft.gates || []).map((gate, index) => (
              <div key={`gate-${index}`} className="sa-structure-card">
                <div className="sa-form sa-form-grid">
                  <label>Gate Name<input value={gate.gateName} onChange={(event) => updateDraft(`gates.${index}.gateName`, event.target.value)} /></label>
                  <label>Gate Number<input value={gate.gateNumber} onChange={(event) => updateDraft(`gates.${index}.gateNumber`, event.target.value)} /></label>
                  <label>Gate Type<select value={gate.gateType} onChange={(event) => updateDraft(`gates.${index}.gateType`, event.target.value)}>
                    <option value="main_gate">Main Gate</option>
                    <option value="visitor_gate">Visitor Gate</option>
                    <option value="service_gate">Service Gate</option>
                    <option value="emergency_gate">Emergency Gate</option>
                  </select></label>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {step === 6 ? (
        <section className="sa-structure-panel">
          <div className="sa-structure-panel-head">
            <div>
              <h4>Parking Setup</h4>
              <p>Generate parking slots as part of the same master setup.</p>
            </div>
          </div>
          <div className="sa-form">
            <label>Total Parking Slots<input type="number" min="0" value={draft.parking?.totalSlots || 0} onChange={(event) => updateDraft("parking.totalSlots", event.target.value)} /></label>
          </div>
        </section>
      ) : null}

      {step === 7 ? (
        <section className="sa-structure-panel">
          <div className="sa-structure-panel-head">
            <div>
              <h4>Review & Publish</h4>
              <p>Preview the structure before saving it as the society foundation.</p>
            </div>
          </div>
          <div className="sa-structure-summary-grid">
            <SummaryBadge label="Towers" value={summary.towers} />
            <SummaryBadge label="Wings" value={summary.wings} />
            <SummaryBadge label="Floors" value={summary.floors} />
            <SummaryBadge label="Flats" value={summary.flats} />
            <SummaryBadge label="Gates" value={summary.gates} />
            <SummaryBadge label="Parking" value={summary.parking} />
          </div>
          <div className="sa-structure-preview">
            <strong>Sample Preview</strong>
            <ul>
              {(draft.towers || []).slice(0, 3).map((tower, towerIndex) => (tower.wings || []).slice(0, 2).map((wing, wingIndex) => (
                <li key={`preview-${towerIndex}-${wingIndex}`}>{tower.towerName || `Tower ${towerIndex + 1}`} / {wing.wingName || `Wing ${wingIndex + 1}`} / {wing.flatPrefix || "A"}-101</li>
              )))}
            </ul>
          </div>
          <div className="sa-structure-actions">
            <button type="button" className="sa-btn" disabled={loading} onClick={publish}>{loading ? "Publishing..." : "Publish Society Structure"}</button>
          </div>
        </section>
      ) : null}

      <div className="sa-structure-actions">
        <button type="button" className="sa-btn sa-btn-ghost" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>Previous</button>
        <button type="button" className="sa-btn" disabled={step === steps.length - 1} onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}>Next</button>
      </div>
    </div>
  );
}
