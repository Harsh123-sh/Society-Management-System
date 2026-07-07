import nexoraFavicon from "../assets/branding/nexora-favicon.png";
import nexoraIcon from "../assets/branding/nexora-icon.png";
import nexoraLogoDark from "../assets/branding/nexora-logo-dark.png";

export const BRAND = {
  name: "NEXORA",
  tagline: "Smart Society Management Platform",
  shortName: "NEXORA",
  initials: "N",
  logo: "/nexora-logo.png",
  icon: nexoraIcon,
  logoLight: "/nexora-logo-light.png",
  logoDark: nexoraLogoDark,
  favicon: nexoraFavicon,
  supportEmail: "contact@nexora.com",
};

export function getBrandedTitle(pageTitle) {
  return pageTitle ? `${pageTitle} | ${BRAND.name}` : `${BRAND.name} | ${BRAND.tagline}`;
}
