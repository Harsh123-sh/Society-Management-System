import { useEffect, useMemo, useRef } from "react";

function OtpInput({ value, onChange, length = 6, disabled = false, autoFocus = false }) {
  const inputRefs = useRef([]);
  const digits = useMemo(
    () => Array.from({ length }, (_, index) => value?.[index] || ""),
    [length, value],
  );

  useEffect(() => {
    if (autoFocus) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  function focusIndex(index) {
    inputRefs.current[index]?.focus();
  }

  function updateAtIndex(index, nextValue) {
    const normalized = nextValue.replace(/\D/g, "").slice(0, 1);
    const nextDigits = [...digits];
    nextDigits[index] = normalized;
    onChange(nextDigits.join(""));
    if (normalized && index < length - 1) {
      focusIndex(index + 1);
    }
  }

  function handleKeyDown(event, index) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      focusIndex(index - 1);
    }
  }

  return (
    <div className="auth-otp">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => updateAtIndex(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          className="auth-otp__input"
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
}

export default OtpInput;
