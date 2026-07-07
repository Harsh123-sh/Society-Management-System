import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import PremiumThemeToggle from "../components/common/PremiumThemeToggle";
import { BRAND } from "../config/brand";

const legalContent = {
  privacy: {
    eyebrow: "Privacy Policy",
    title: "Privacy Policy",
    updated: "Last updated: June 24, 2026",
    intro: "This Privacy Policy explains how Nexora collects, uses, stores, and protects information across the Smart Society Platform.",
    sections: [
      ["Information We Collect", "We collect account details, society details, resident records, visitor logs, billing records, complaint data, device metadata, and support communications needed to operate the platform."],
      ["How We Use Data", "We use data to authenticate users, provide role-based access, process society workflows, generate operational insights, improve reliability, prevent misuse, and support users."],
      ["Cookies", "Nexora may use cookies and local storage to keep users signed in, remember preferences, support language and theme settings, and improve platform performance."],
      ["Security", "We apply access controls, encrypted transport, audit-friendly workflows, and operational safeguards designed to protect society and resident data."],
      ["Data Retention", "We retain information while accounts or society workspaces are active and as required for operational, legal, tax, security, and dispute-resolution purposes."],
      ["Third Party Services", "Nexora may integrate with infrastructure, analytics, messaging, payment, storage, and support providers that help deliver the platform under appropriate safeguards."],
      ["User Rights", "Users may request access, correction, export, or deletion of applicable personal information subject to society administration controls and legal requirements."],
      ["Account Deletion", "Account deletion requests can be submitted through support or society administrators. Some records may be retained where required for compliance, billing, or audit history."],
      ["Policy Updates", "We may update this policy as the platform evolves. Material updates will be communicated through the application or official contact channels."],
      ["Contact Information", `For privacy questions, contact ${BRAND.supportEmail}.`],
    ],
  },
  terms: {
    eyebrow: "Terms & Conditions",
    title: "Terms & Conditions",
    updated: "Last updated: June 24, 2026",
    intro: "These Terms govern access to and use of Nexora, including website, dashboard, mobile, and society management workflows.",
    sections: [
      ["Introduction", "By accessing Nexora, you agree to use the platform responsibly and in accordance with these Terms, applicable laws, and society policies."],
      ["User Eligibility", "Users must be authorized residents, committee members, staff, guards, accountants, administrators, or invited stakeholders of a society using Nexora."],
      ["Account Responsibilities", "Users are responsible for maintaining account confidentiality, using accurate information, and immediately reporting suspected unauthorized access."],
      ["Payments", "Payment features may be used for society dues, invoices, subscriptions, or related services. Users must provide accurate payment information."],
      ["Billing", "Plan fees, society charges, invoices, taxes, and collection rules are communicated through the platform, subscription agreement, or society administration."],
      ["Refund Policy", "Refunds, if any, are handled according to the applicable subscription agreement, society policy, payment provider rules, and legal requirements."],
      ["Data Usage", "Nexora processes data to deliver platform features, support role-based workflows, maintain security, provide analytics, and improve services."],
      ["Acceptable Use", "Users must not misuse the platform, upload unlawful content, attempt unauthorized access, disrupt services, or compromise another user's data."],
      ["Termination", "Access may be suspended or terminated for policy violations, security risk, non-payment, society offboarding, or legal obligations."],
      ["Limitation of Liability", "To the maximum extent permitted by law, Nexora is not liable for indirect, incidental, or consequential losses arising from platform use."],
      ["Governing Law", "These Terms are governed by applicable Indian laws unless a separate written agreement states otherwise."],
      ["Contact Information", `For terms, billing, or service questions, contact ${BRAND.supportEmail}.`],
    ],
  },
};

function FloatingAiAssistant() {
  const prompts = ["Generate Monthly Report", "Show Pending Complaints", "Create Maintenance Bill", "Schedule AGM", "Analyze Society Health", "Create Notice"];

  return (
    <aside className="nx-floating-ai" aria-label="Nexora AI assistant">
      <div><strong>AI</strong><span>Nexora Assistant</span></div>
      <p>Ask AI to draft reports, notices, bills, schedules, and society health summaries.</p>
      <div>{prompts.map((prompt) => <button type="button" key={prompt}>{prompt}</button>)}</div>
    </aside>
  );
}

export default function LegalPage({ type = "privacy" }) {
  const content = legalContent[type] || legalContent.privacy;

  return (
    <main className="public-v2 nx-legal-page nx-startup">
      <nav className="nx-legal-nav">
        <BrandLogo variant="full" />
        <div>
          <PremiumThemeToggle />
          <Link to="/">Back to Home</Link>
        </div>
      </nav>

      <section className="nx-legal-hero">
        <span>{content.eyebrow}</span>
        <h1>{content.title}</h1>
        <p>{content.intro}</p>
        <em>{content.updated}</em>
      </section>

      <section className="nx-legal-content">
        {content.sections.map(([title, body]) => (
          <article key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>
      <FloatingAiAssistant />
    </main>
  );
}
