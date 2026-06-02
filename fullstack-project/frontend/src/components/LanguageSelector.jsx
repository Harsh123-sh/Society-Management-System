import { useTranslation } from "../contexts/LanguageContext";

export default function LanguageSelector({ className = "" }) {
  const { locale, setLocale, languageOptions, t } = useTranslation();

  return (
    <div className={`language-selector ${className}`}>
      <label htmlFor="language-selector" className="sr-only">
        {t("common.language")}
      </label>
      <select
        id="language-selector"
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
        className="rounded-xl border px-3 py-2 text-sm"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      >
        {languageOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
