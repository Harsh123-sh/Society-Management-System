import AuthInput from "./AuthInput";

export default function SocietyCodeInput({ value, onChange, label = "Society code", helperText, societyName, status }) {
  return (
    <div className="space-y-1">
      <AuthInput
        id="society-code"
        name="societyCode"
        label={label}
        value={value}
        onChange={onChange}
        placeholder="e.g. GREEN-VALLEY"
        className="auth-society-code"
      />
      {helperText ? <p className="text-xs text-white/65">{helperText}</p> : null}
      {societyName ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85">
          <p className="font-semibold text-white">{societyName}</p>
          <p className="mt-1 text-xs text-white/70">{status || "Verified society identity"}</p>
        </div>
      ) : null}
    </div>
  );
}
