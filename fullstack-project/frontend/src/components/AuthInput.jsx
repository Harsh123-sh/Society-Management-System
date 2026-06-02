import FloatingInput from "./FloatingInput";

export default function AuthInput(props) {
  return <FloatingInput className={`auth-input ${props.className || ""}`} {...props} />;
}
