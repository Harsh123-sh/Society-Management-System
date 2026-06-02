import GradientButton from "./GradientButton";

export default function AuthButton(props) {
  return <GradientButton className={`auth-button ${props.className || ""}`} {...props} />;
}
