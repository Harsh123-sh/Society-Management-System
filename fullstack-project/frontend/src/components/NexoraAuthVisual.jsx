import { BRAND } from "../config/brand";

function ParticleField() {
  return (
    <>
      <span className="nexora-float-dot nexora-float-dot-one" />
      <span className="nexora-float-dot nexora-float-dot-two" />
      <span className="nexora-float-dot nexora-float-dot-three" />
      <span className="nexora-float-dot nexora-float-dot-four" />
      <span className="nexora-float-dot nexora-float-dot-five" />
      <span className="nexora-data-stream stream-one" />
      <span className="nexora-data-stream stream-two" />
      <span className="nexora-data-stream stream-three" />
    </>
  );
}

function LogoOrbit() {
  return (
    <div className="nexora-login-stage" aria-hidden="true">
      <span className="nexora-stage-aura" />
      <span className="nexora-orbit nexora-orbit-one"><i /></span>
      <span className="nexora-orbit nexora-orbit-two"><i /></span>
      <span className="nexora-orbit nexora-orbit-three"><i /></span>
      <span className="nexora-hero-mark">
        <img className="nexora-real-icon" src={BRAND.icon} alt="" />
      </span>
      <span className="nexora-platform">
        <i />
        <b />
      </span>
      <ParticleField />
    </div>
  );
}

function SocietyNetwork() {
  return (
    <div className="nexora-auth-visual nexora-auth-visual--network" aria-hidden="true">
      <span className="nexora-orbit nexora-orbit-one" />
      <span className="nexora-city-line line-one" />
      <span className="nexora-city-line line-two" />
      <span className="nexora-city-tower tower-one" />
      <span className="nexora-city-tower tower-two" />
      <span className="nexora-city-tower tower-three" />
      <span className="nexora-visual-icon"><img src={BRAND.icon} alt="" /></span>
      <span className="nexora-city-node node-one" />
      <span className="nexora-city-node node-two" />
      <span className="nexora-city-node node-three" />
      <ParticleField />
    </div>
  );
}

function ShieldVisual() {
  return (
    <div className="nexora-auth-visual nexora-auth-visual--shield" aria-hidden="true">
      <span className="nexora-security-ring" />
      <span className="nexora-security-ring ring-two" />
      <span className="nexora-otp-pulse pulse-one" />
      <span className="nexora-otp-pulse pulse-two" />
      <span className="nexora-shield">
        <img src={BRAND.icon} alt="" />
        <span />
        <b />
      </span>
    </div>
  );
}

function RecoveryVisual() {
  return (
    <div className="nexora-auth-visual nexora-auth-visual--recovery" aria-hidden="true">
      <span className="nexora-recovery-path" />
      <span className="nexora-recovery-path path-two" />
      <span className="nexora-key-glow" />
      <span className="nexora-visual-icon nexora-visual-icon--key"><img src={BRAND.icon} alt="" /></span>
      <span className="nexora-lock">
        <img src={BRAND.icon} alt="" />
        <span />
        <b />
      </span>
    </div>
  );
}

export default function NexoraAuthVisual({ type = "login" }) {
  if (type === "register") return <SocietyNetwork />;
  if (type === "otp") return <ShieldVisual />;
  if (type === "forgot" || type === "reset") return <RecoveryVisual />;
  return <LogoOrbit />;
}
