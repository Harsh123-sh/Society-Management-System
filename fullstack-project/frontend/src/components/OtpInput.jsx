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
    <div className="flex flex-wrap gap-2 sm:gap-3">
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
          className="auth-input h-14 w-12 rounded-2xl px-0 text-center text-lg font-semibold tracking-[0.2em] sm:h-16 sm:w-14"
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
}

export default OtpInput;