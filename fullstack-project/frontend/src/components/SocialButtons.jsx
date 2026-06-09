import { useNavigate } from "react-router-dom";

function buildQuery(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export default function SocialButtons({ email = "", societyCode = "", onNotice }) {
  const navigate = useNavigate();
  const buttonClass =
    "flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-medium shadow-lg shadow-[rgba(15,23,42,0.18)] transition focus:outline-none focus:ring-2 focus:ring-cyan-400";
  const enabledStyle = {
    backgroundColor: "var(--surface)",
    borderColor: "var(--border)",
    color: "var(--text)",
  };

  function goToRegister() {
    navigate(`/register${buildQuery({ societyCode })}`);
  }

  function goToVerifyEmail() {
    navigate(`/verify-otp${buildQuery({ email, societyCode })}`);
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <button
        type="button"
        className={`${buttonClass} cursor-not-allowed opacity-60`}
        style={enabledStyle}
        disabled
        title="GitHub login coming soon"
        aria-label="GitHub login coming soon"
        onClick={() => onNotice?.("GitHub login coming soon")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.16 6.84 9.49.5.09.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.6-3.37-1.16-3.37-1.16-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1.01.07 1.54 1.04 1.54 1.04.9 1.54 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85.003 1.71.115 2.51.337 1.9-1.29 2.74-1.02 2.74-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85 0 1.33-.01 2.4-.01 2.73 0 .27.18.58.69.48A10 10 0 0022 12c0-5.52-4.48-10-10-10z" fill="currentColor" />
        </svg>
        GitHub
      </button>

      <button type="button" className={`${buttonClass} hover:shadow-xl`} style={enabledStyle} onClick={goToRegister}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 12a5 5 0 100-10 5 5 0 000 10zM21 21s-4.5-4-9-4-9 4-9 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Sign up
      </button>

      <button type="button" className={`${buttonClass} hover:shadow-xl`} style={enabledStyle} onClick={goToVerifyEmail}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 5h16v14H4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Verify Email
      </button>
    </div>
  );
}
