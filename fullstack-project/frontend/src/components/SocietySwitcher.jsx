import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../contexts/LanguageContext";
import { useSociety } from "../contexts/SocietyContext";

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function SocietyAvatar({ society }) {
  if (society?.logo_url) {
    return <img src={society.logo_url} alt="" />;
  }

  return <span>{String(society?.name || society?.code || "S").slice(0, 1).toUpperCase()}</span>;
}

export default function SocietySwitcher({ compact = false, showAnalytics = false }) {
  const { t } = useTranslation();
  const {
    societies,
    selectedSociety,
    setSelectedSociety,
    recentSocieties,
    favoriteSocieties,
    favoriteSocietyIds,
    toggleFavoriteSociety,
    loading,
  } = useSociety();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredSocieties = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return societies;
    return societies.filter((society) =>
      [society.name, society.code, society.status].some((value) => String(value || "").toLowerCase().includes(search))
    );
  }, [query, societies]);

  const sections = [
    { title: t("society.favorites", "Favorite Societies"), rows: favoriteSocieties },
    { title: t("society.recent", "Recent Societies"), rows: recentSocieties },
    { title: t("society.allSocieties", "All Societies"), rows: filteredSocieties },
  ].filter((section) => section.rows.length);

  return (
    <div className={`society-switcher ${compact ? "is-compact" : ""}`}>
      <button type="button" className="society-switcher__trigger" onClick={() => setOpen((value) => !value)}>
        <SocietyAvatar society={selectedSociety} />
        <span>
          <strong>{selectedSociety?.name || t("society.switcher", "Society Switcher")}</strong>
          <em>{selectedSociety?.code || selectedSociety?.id || t("common.loading", "Loading")}</em>
        </span>
      </button>

      {open && (
        <div className="society-switcher__panel">
          <div className="society-switcher__head">
            <div>
              <strong>{t("society.switcher", "Society Switcher")}</strong>
              <p>{t("society.dataIsolation", "Data is isolated to the selected society")}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close">×</button>
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("society.searchPlaceholder", "Search society name or code")}
            className="society-switcher__search"
          />

          {loading ? (
            <div className="society-switcher__empty">{t("common.loadingActiveSocieties", "Loading active societies...")}</div>
          ) : (
            <div className="society-switcher__sections">
              {sections.map((section) => (
                <section key={section.title}>
                  <h3>{section.title}</h3>
                  {section.rows.map((society) => {
                    const selected = String(society.id) === String(selectedSociety?.id);
                    const favorite = favoriteSocietyIds.includes(String(society.id));
                    return (
                      <article key={`${section.title}-${society.id}`} className={selected ? "is-selected" : ""}>
                        <button
                          type="button"
                          className="society-switcher__row"
                          onClick={() => {
                            setSelectedSociety(society);
                            setOpen(false);
                          }}
                        >
                          <SocietyAvatar society={society} />
                          <span>
                            <strong>{society.name}</strong>
                            <em>{society.code} · {society.status}</em>
                          </span>
                        </button>
                        <button
                          type="button"
                          className={`society-switcher__favorite ${favorite ? "is-favorite" : ""}`}
                          onClick={() => toggleFavoriteSociety(society.id)}
                          aria-label={favorite ? "Remove favorite" : "Add favorite"}
                        >
                          ★
                        </button>
                      </article>
                    );
                  })}
                </section>
              ))}
            </div>
          )}

          {selectedSociety && (
            <div className="society-switcher__analytics">
              <span><strong>{formatNumber(selectedSociety.resident_count)}</strong>{t("society.residentCount", "Residents")}</span>
              <span><strong>{selectedSociety.occupancy_rate || 0}%</strong>{t("society.occupancyRate", "Occupancy")}</span>
              <span><strong>{formatNumber(selectedSociety.pending_complaints)}</strong>{t("society.pendingComplaints", "Pending complaints")}</span>
              <span><strong>{formatCurrency(selectedSociety.monthly_collections)}</strong>{t("society.monthlyCollections", "Monthly collections")}</span>
            </div>
          )}

          <div className="society-switcher__actions">
            <button type="button" onClick={() => setOpen(false)}>{t("society.switchSociety", "Switch Society")}</button>
            <Link to="/admin/dashboard">{t("society.openSociety", "Open Society")}</Link>
            {showAnalytics && <Link to="/admin/analytics">{t("society.viewAnalytics", "View Analytics")}</Link>}
            <Link to="/super-admin/dashboard">{t("society.manageSociety", "Manage Society")}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
