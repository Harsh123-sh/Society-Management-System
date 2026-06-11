import AuthInput from "./AuthInput";

export default function SocietyCodeInput({ value, onChange, label = "Society code", helperText, societyName, status }) {
  return (
    <div className="auth-society-code-wrap">
      <AuthInput
        id="society-code"
        name="societyCode"
        label={label}
        value={value}
        onChange={onChange}
        placeholder="e.g. GREEN-VALLEY"
        className="auth-society-code"
      />
      {helperText ? <p className="auth-helper-text">{helperText}</p> : null}
      {societyName ? (
        <div className="auth-society-card">
          <p>{societyName}</p>
          <span>{status || "Verified society identity"}</span>
        </div>
      ) : null}
    </div>
  );
}
