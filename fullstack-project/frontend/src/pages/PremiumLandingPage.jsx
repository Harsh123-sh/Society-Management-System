import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import LanguageSelector from "../components/LanguageSelector";
import PremiumThemeToggle from "../components/common/PremiumThemeToggle";
import nexoraIcon from "../assets/branding/nexora-icon.png";
import "../styles/nexora-home.css";

const Motion = motion;

const navItems = [
  ["Platform", "#product"],
  ["Contact", "#contact"],
];

const heroChips = ["Multi Society", "AI Powered", "Secure", "Cloud Based"];

const whyCards = [
  ["AI Automation", "Summarize activity, surface risks, and reduce repetitive society operations."],
  ["Protected Workflows", "Role based access, OTP verification, audit trails, and controlled records."],
  ["Cloud Platform", "Run operations from anywhere with resilient access for every stakeholder."],
  ["Fast Deployment", "Launch societies, invite residents, and digitize core workflows quickly."],
  ["Multi Society", "Manage one community or a full portfolio with clean separation and visibility."],
  ["Real-time Analytics", "Track collections, complaints, visitors, and service health as work happens."],
];

const features = [
  ["Visitor Management", "QR approvals, gate records, visitor logs, and instant resident notifications."],
  ["Resident Management", "Verified resident, owner, tenant, family, and access records."],
  ["Flats & Properties", "Towers, wings, flats, occupancy, parking, and property documents."],
  ["Maintenance Billing", "Dues, reminders, receipts, reconciliation, and billing cycle control."],
  ["Payment Collection", "Online payments, receipts, dues tracking, and follow-up visibility."],
  ["Complaints", "Requests, assignment, SLA tracking, closure proof, and resident updates."],
  ["Notice Board", "Announcements, circulars, emergency alerts, and delivery tracking."],
  ["Facility Booking", "Amenity reservations, approvals, calendars, and usage records."],
  ["Staff Management", "Attendance, tasks, documents, emergency contacts, and service proof."],
  ["Reports & Analytics", "Committee-ready reports across finance, operations, residents, and security."],
  ["Security Management", "Approval queues, scanner flows, incidents, and visitor history."],
  ["AI Assistant", "Draft notices, summarize issues, recommend actions, and answer workflow questions."],
];

const featureGroups = [
  ["Operations", ["Visitor Management", "Resident Management", "Flats & Properties", "Complaints", "Notice Board", "Facility Booking"]],
  ["Finance", ["Maintenance Billing", "Payment Collection", "Reports & Analytics"]],
  ["Teams", ["Staff Management", "Security Management", "AI Assistant"]],
];

const featureMap = new Map(features.map(([title, text]) => [title, text]));

const pricingPlans = [
  {
    name: "Starter",
    monthly: 2999,
    yearly: 29990,
    description: "For a single society moving core operations online.",
    features: ["Resident onboarding", "Visitor approvals", "Maintenance billing", "Notices", "Basic reports"],
  },
  {
    name: "Professional",
    monthly: 6999,
    yearly: 69990,
    description: "For active societies that need automation, finance, and operational depth.",
    features: ["Everything in Starter", "AI assistant", "Payment collection", "Advanced reports", "Staff workflows", "Priority support"],
    featured: true,
  },
  {
    name: "Enterprise",
    monthly: null,
    yearly: null,
    description: "For builders, operators, and multi-society portfolios.",
    features: ["Everything in Professional", "Multi-society controls", "Dedicated onboarding", "Custom workflows", "Portfolio analytics", "SLA support"],
  },
];

const faqs = [
  ["What is Nexora?", "Nexora is an AI powered society management platform for residents, committees, guards, staff, vendors, and property operators."],
  ["Can Nexora manage multiple societies?", "Yes. Nexora supports single societies and multi-society portfolios with role based access and centralized controls."],
  ["Is online maintenance payment supported?", "Yes. Nexora supports maintenance billing, reminders, payment collection, receipts, and reconciliation workflows."],
  ["Can security guards use Nexora?", "Yes. Guards get visitor approval, QR scanning, verification, incident logs, and visitor history workflows."],
  ["Does Nexora include AI assistance?", "Yes. Nexora includes AI support for summaries, notices, complaints, reports, and operational recommendations."],
  ["How can we request a demo?", "Use the demo form on this page or the Book Demo call-to-action to share your society details."],
];

const footerColumns = [
  ["Company", ["About Nexora", "Customers", "Careers", "Contact"]],
  ["Product", ["Features", "Pricing", "FAQ", "Book Demo"]],
  ["Resources", ["Help Center", "Implementation", "Blog", "Status"]],
  ["Legal", ["Privacy Policy", "Terms & Conditions", "Cookie Policy", "Security"]],
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const panelVariants = {
  hidden: { height: 0, opacity: 0, y: -12 },
  show: {
    height: "auto",
    opacity: 1,
    y: 0,
    transition: {
      height: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
      opacity: { duration: 0.3 },
      y: { type: "spring", stiffness: 190, damping: 24 },
      staggerChildren: 0.045,
      delayChildren: 0.05,
    },
  },
  exit: { height: 0, opacity: 0, y: -10, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 240, damping: 24 } },
};

function BrandMark() {
  return (
    <Link to="/" className="nxh-brand" aria-label="Nexora homepage">
      <span className="nxh-brand-icon">
        <img src={nexoraIcon} alt="" />
      </span>
      <span className="nxh-brand-text">
        <strong>Nexora</strong>
        <em>AI Society Platform</em>
      </span>
    </Link>
  );
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Motion.header className="nxh-navbar" initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}>
      <div className="nxh-nav-inner">
        <BrandMark />
        <nav className="nxh-nav-links" aria-label="Primary navigation">
          {navItems.map(([label, href]) => (
            <a key={label} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="nxh-nav-actions">
          <LanguageSelector className="nxh-language" supportedCodes={["en", "hi", "gu"]} />
          <PremiumThemeToggle />
          <Link className="nxh-btn nxh-btn-subtle" to="/login">Login</Link>
          <Link className="nxh-btn nxh-btn-primary" to="/register">Create Account</Link>
          <button type="button" className="nxh-menu" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle navigation menu" aria-expanded={menuOpen}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <Motion.div className="nxh-mobile-menu" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {navItems.map(([label, href]) => (
              <a key={label} href={href} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
            <Link to="/login">Login</Link>
            <Link to="/register">Create Account</Link>
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.header>
  );
}

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="nxh-section-heading">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

function DashboardPreview() {
  const kpis = [
    ["INR 8.4L", "Revenue"],
    ["126", "Visitors"],
    ["18", "Open Tasks"],
    ["94%", "Resolved"],
  ];
  const activities = [
    ["Payment received", "A-1204 maintenance cleared"],
    ["Visitor approved", "Gate 2 QR pass issued"],
    ["Complaint updated", "Lift inspection scheduled"],
  ];

  return (
    <Motion.aside className="nxh-dashboard-preview" initial={{ opacity: 0, y: 28, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }} aria-label="Nexora dashboard preview">
      <div className="nxh-dashboard-sidebar" aria-hidden="true">
        <span className="is-active">N</span>
        <span>H</span>
        <span>V</span>
        <span>B</span>
        <span>C</span>
      </div>
      <div className="nxh-dashboard-main">
        <div className="nxh-dashboard-topbar">
          <div>
            <span />
            <span />
            <span />
          </div>
          <strong>Command Center</strong>
          <em>Live</em>
        </div>
        <div className="nxh-dashboard-head">
          <article className="nxh-greeting-card">
            <span>Good morning, Committee</span>
            <strong>Society operations are on track</strong>
            <p>AI summarized revenue, visitors, complaints, and notices for today.</p>
          </article>
          <label className="nxh-society-select">
            <span>Society</span>
            <select defaultValue="nexora-heights" aria-label="Select society">
              <option value="nexora-heights">Nexora Heights</option>
              <option value="palm-vista">Palm Vista</option>
              <option value="azure-estate">Azure Estate</option>
            </select>
          </label>
        </div>
        <div className="nxh-dashboard-kpis">
          {kpis.map(([value, label]) => (
            <article key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </article>
          ))}
        </div>
        <div className="nxh-dashboard-lower">
          <article className="nxh-revenue-card">
            <div>
              <span>Revenue graph</span>
              <strong>Collections trend</strong>
            </div>
            <div className="nxh-chart" aria-hidden="true">
              {[42, 58, 48, 72, 64, 86, 78].map((height, index) => (
                <i key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
          </article>
          <article className="nxh-activity-card">
            <span>Recent activity</span>
            {activities.map(([title, text]) => (
              <div key={title}>
                <b />
                <p>
                  <strong>{title}</strong>
                  <em>{text}</em>
                </p>
              </div>
            ))}
          </article>
        </div>
      </div>
    </Motion.aside>
  );
}

function PremiumTrigger({ panel, icon, title, subtitle, openPanel, onToggle }) {
  const isOpen = openPanel === panel;

  const handlePointerDown = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--ripple-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--ripple-y", `${event.clientY - rect.top}px`);
  };

  return (
    <Motion.button
      type="button"
      className="nxh-premium-trigger"
      onClick={() => onToggle(panel)}
      onPointerDown={handlePointerDown}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      aria-expanded={isOpen}
      aria-controls={`nxh-${panel}-panel`}
    >
      <span className="nxh-trigger-icon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: icon }} />
      <span className="nxh-trigger-copy">
        <strong>{title}</strong>
        <em>{subtitle}</em>
      </span>
      <Motion.span className="nxh-trigger-chevron" animate={{ rotate: isOpen ? 180 : 0 }} aria-hidden="true">v</Motion.span>
    </Motion.button>
  );
}

function WhyPanel() {
  return (
    <div className="nxh-panel-shell">
      <SectionHeading eyebrow="Why Nexora" title="Built for clean society operations." text="Nexora gives committees, residents, staff, and guards the right workflow without making the homepage feel heavy." />
      <Motion.div className="nxh-why-grid" variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
        {whyCards.map(([title, text], index) => (
          <Motion.article className="nxh-card" key={title} variants={staggerItem}>
            <div className="nxh-card-icon">{String(index + 1).padStart(2, "0")}</div>
            <h3>{title}</h3>
            <p>{text}</p>
          </Motion.article>
        ))}
      </Motion.div>
    </div>
  );
}

function FeaturesPanel() {
  return (
    <div className="nxh-panel-shell">
      <SectionHeading eyebrow="Complete Features" title="All core modules in one connected platform." text="Open the details only when needed. The homepage stays clean while every product capability remains available." />
      <Motion.div className="nxh-feature-groups" variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
        {featureGroups.map(([group, items]) => (
          <Motion.article className="nxh-feature-group" key={group} variants={staggerItem}>
            <h3>{group}</h3>
            <div className="nxh-feature-module-grid">
              {items.map((item) => (
                <div className="nxh-feature-module" key={item}>
                  <strong>{item}</strong>
                  <p>{featureMap.get(item)}</p>
                </div>
              ))}
            </div>
          </Motion.article>
        ))}
      </Motion.div>
    </div>
  );
}

function PricingPanel() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const isYearly = billingCycle === "yearly";
  const formatPrice = (plan) => {
    if (!plan.monthly) return "Custom";
    const amount = isYearly ? plan.yearly : plan.monthly;
    return `INR ${amount.toLocaleString("en-IN")}${isYearly ? "/year" : "/month"}`;
  };

  return (
    <div className="nxh-panel-shell">
      <SectionHeading eyebrow="Pricing" title="Plans that scale with your society." text="Choose monthly flexibility or yearly value. Every plan keeps onboarding simple." />
      <div className="nxh-billing-toggle" role="group" aria-label="Billing cycle">
        {["monthly", "yearly"].map((cycle) => (
          <button key={cycle} type="button" className={billingCycle === cycle ? "is-active" : ""} onClick={() => setBillingCycle(cycle)}>
            {cycle === "monthly" ? "Monthly" : "Yearly"}
          </button>
        ))}
      </div>
      <Motion.div className="nxh-pricing-grid" variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
        {pricingPlans.map((plan) => (
          <Motion.article className={plan.featured ? "is-featured" : ""} key={plan.name} variants={staggerItem}>
            {plan.featured && <em>Most popular</em>}
            <span>{plan.name}</span>
            <strong>{formatPrice(plan)}</strong>
            <p>{plan.description}</p>
            <ul>
              {plan.features.map((point) => <li key={point}>{point}</li>)}
            </ul>
            <Link className="nxh-btn nxh-btn-primary" to="/register">Get Started</Link>
          </Motion.article>
        ))}
      </Motion.div>
    </div>
  );
}

function FaqPanel() {
  const [openQuestion, setOpenQuestion] = useState(0);

  return (
    <div className="nxh-panel-shell">
      <SectionHeading eyebrow="FAQ" title="Answers before your demo call." text="Only one answer stays open at a time, keeping the page calm and easy to scan." />
      <Motion.div className="nxh-faq-list" variants={{ show: { transition: { staggerChildren: 0.04 } } }}>
        {faqs.map(([question, answer], index) => {
          const isOpen = openQuestion === index;
          return (
            <Motion.article className="nxh-faq-item" key={question} variants={staggerItem}>
              <button type="button" onClick={() => setOpenQuestion(isOpen ? null : index)} aria-expanded={isOpen} aria-controls={`nxh-faq-answer-${index}`}>
                <span>{question}</span>
                <Motion.i animate={{ rotate: isOpen ? 180 : 0 }} aria-hidden="true">v</Motion.i>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <Motion.div id={`nxh-faq-answer-${index}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                    <p>{answer}</p>
                  </Motion.div>
                )}
              </AnimatePresence>
            </Motion.article>
          );
        })}
      </Motion.div>
    </div>
  );
}

function ExpandableHomepageSections() {
  const [openPanel, setOpenPanel] = useState(null);
  const panels = useMemo(() => ({
    why: <WhyPanel />,
    features: <FeaturesPanel />,
    pricing: <PricingPanel />,
    faq: <FaqPanel />,
  }), []);

  const triggers = [
    ["why", "&#10024;", "Why Nexora", "Enterprise trust, clarity, and polished workflows"],
    ["features", "&#128640;", "Complete Features", "All core modules grouped for modern societies"],
    ["pricing", "&#128176;", "Pricing", "Plans, comparison, and monthly or yearly billing"],
    ["faq", "?", "FAQ", "Fast answers in a focused accordion"],
  ];

  const togglePanel = (panel) => setOpenPanel((current) => (current === panel ? null : panel));

  return (
    <Motion.section className="nxh-section nxh-interactive-sections" id="features" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.16 }}>
      <span id="why-nexora" className="nxh-anchor" />
      <span id="pricing" className="nxh-anchor" />
      <span id="faq" className="nxh-anchor" />
      <div className="nxh-interactive-focus">
        {triggers.map(([panel, icon, title, subtitle]) => (
          <PremiumTrigger key={panel} panel={panel} icon={icon} title={title} subtitle={subtitle} openPanel={openPanel} onToggle={togglePanel} />
        ))}
      </div>
      <AnimatePresence initial={false} mode="wait">
        {openPanel && (
          <Motion.div key={openPanel} id={`nxh-${openPanel}-panel`} className="nxh-premium-panel" variants={panelVariants} initial="hidden" animate="show" exit="exit">
            {panels[openPanel]}
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.section>
  );
}

export default function PremiumLandingPage() {
  const [isSubmittingDemo, setIsSubmittingDemo] = useState(false);

  useEffect(() => {
    document.title = "Nexora | AI Powered Society Management Platform";
  }, []);

  const handleDemoSubmit = (event) => {
    event.preventDefault();
    setIsSubmittingDemo(true);
    window.setTimeout(() => setIsSubmittingDemo(false), 900);
  };

  return (
    <main className="nxh-page">
      <Navbar />

      <section className="nxh-hero" id="product">
        <Motion.div className="nxh-hero-copy" variants={fadeUp} initial="hidden" animate="show">
          <span className="nxh-badge">NEXORA AI SOCIETY PLATFORM</span>
          <h1>
            <span>AI Powered Society</span>
            <span>Management Platform</span>
          </h1>
          <p>Nexora brings residents, committees, guards, staff, billing, visitors, complaints, and AI assistance into one clean enterprise platform.</p>
          <div className="nxh-hero-actions">
            <Link className="nxh-btn nxh-btn-primary nxh-btn-large" to="/register">Start Free Trial</Link>
            <a className="nxh-btn nxh-btn-glass nxh-btn-large" href="#contact">Book Demo</a>
            <Link className="nxh-btn nxh-btn-subtle nxh-btn-large" to="/login">Demo Account</Link>
          </div>
          <div className="nxh-hero-chips" aria-label="Nexora platform highlights">
            {heroChips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
        </Motion.div>
        <DashboardPreview />
      </section>

      <ExpandableHomepageSections />

      <Motion.section className="nxh-demo" id="contact" variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
        <div className="nxh-demo-copy">
          <span>Book Demo</span>
          <h2>See Nexora configured for your society.</h2>
          <p>Share a few details and our team will map Nexora to your billing, resident, visitor, and staff workflows.</p>
          <div className="nxh-demo-points">
            <span>No credit card required</span>
            <span>Cloud deployment</span>
            <span>Role based onboarding</span>
          </div>
        </div>
        <form className="nxh-demo-form" onSubmit={handleDemoSubmit}>
          {["Name", "Mobile", "Email", "Society Name", "City", "Number of Flats", "Role"].map((label) => (
            <label key={label}>
              <span>{label}</span>
              <input type={label === "Email" ? "email" : label === "Mobile" || label === "Number of Flats" ? "tel" : "text"} placeholder={label} />
            </label>
          ))}
          <button type="submit" className={isSubmittingDemo ? "is-loading" : ""} disabled={isSubmittingDemo}>
            <span>{isSubmittingDemo ? "Submitting" : "Submit Demo Request"}</span>
            <i aria-hidden="true">-&gt;</i>
          </button>
        </form>
      </Motion.section>

      <footer className="nxh-footer">
        <div className="nxh-footer-main">
          <div className="nxh-footer-brand">
            <BrandMark />
            <p>Premium AI-powered society management for modern residential communities, builders, committees, and property operators.</p>
          </div>
          {footerColumns.map(([title, links]) => (
            <nav key={title} aria-label={`${title} footer links`}>
              <h3>{title}</h3>
              {links.map((link) => (
                <a key={link} href={link.includes("Privacy") ? "/privacy-policy" : link.includes("Terms") ? "/terms-and-conditions" : "#contact"}>{link}</a>
              ))}
            </nav>
          ))}
          <div className="nxh-footer-contact">
            <h3>Contact</h3>
            <a href="mailto:contact@nexora.com"><span>Email</span>contact@nexora.com</a>
            <a href="tel:+919876543210"><span>Phone</span>+91 98765 43210</a>
            <a href="#contact"><span>Address</span>Pune, Maharashtra, India</a>
          </div>
        </div>
        <div className="nxh-footer-bottom">
          <span>© 2026 Nexora</span>
          <nav aria-label="Footer legal links">
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/terms-and-conditions">Terms & Conditions</a>
            <a href="#contact">Cookie Policy</a>
          </nav>
          <div className="nxh-socials" aria-label="Social links">
            {["in", "x", "yt"].map((item) => (
              <a key={item} href="#contact" aria-label={`${item} social profile`}>{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
