import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal, RevealGroup, revealItem, HoverCard, CountUp, GradientBlob, PulseDot } from "./shared/motion";
import { VitalsWave, RadarPulse, BedGridIllustration, NetworkGraph, SpinRing, ScanSweep, PulseBadge } from "./shared/illustrations";

// ── Inline SVG Icons ─────────────────────────────────────────────────────────

const Logo = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11 6v10M6 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M4 2.5l8 4.5-8 4.5V2.5z" fill="currentColor" />
  </svg>
);

const IconChat = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconBook = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2V3zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7V3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconShieldAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconShieldCheck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconBed = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 9V19M21 9V19M3 14h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M3 9h18V6a2 2 0 00-2-2H5a2 2 0 00-2 2v3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="8" cy="6" r="1.5" fill="currentColor" />
  </svg>
);

const IconRefresh = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconFile = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconActivity = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconBrain = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 5a7 7 0 00-7 7c0 1.48.46 2.86 1.24 4H12M12 5a7 7 0 017 7c0 1.48-.46 2.86-1.24 4H12M12 5v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="5" cy="10" r="1" fill="currentColor" />
    <circle cx="19" cy="10" r="1" fill="currentColor" />
  </svg>
);

const IconUsers = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconAmbulance = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="1" y="7" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M19 10h2l2 4v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="17" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 11h4M9 9v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2L1.5 17h17L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 8v4M10 14.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconEye = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const IconFilter = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1 2h12l-4.5 5.5V12L5.5 13V7.5L1 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["Platform", "Solutions", "How It Works", "Resources", "About Us"];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        backgroundColor: scrolled ? "rgba(247,245,242,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid #E0DAD3" : "1px solid transparent",
        transition: "all 0.25s ease",
      }}
    >
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <motion.a href="#" whileHover={{ scale: 1.03 }} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#111111" }}>
          <motion.span whileHover={{ rotate: 90 }} transition={{ duration: 0.3 }} style={{ display: "flex" }}>
            <Logo />
          </motion.span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15, letterSpacing: "0.04em" }}>HEALTHFLOW AI</span>
        </motion.a>

        <nav style={{ display: "flex", alignItems: "center", gap: 8 }} className="hidden-mobile">
          {links.map((l) => (
            <a
              key={l}
              href="#"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 400,
                color: "#444",
                textDecoration: "none",
                padding: "6px 14px",
                borderRadius: 6,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#111")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
            >
              {l}
            </a>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            style={{
              display: "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#111",
              padding: 4,
            }}
            className="show-mobile"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <IconX /> : <IconMenu />}
          </button>
          <a
            href="/app"
            style={{
              backgroundColor: "#111111",
              color: "#F7F5F2",
              border: "none",
              borderRadius: 8,
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
              letterSpacing: "0.02em",
              transition: "opacity 0.15s",
              textDecoration: "none",
              display: "inline-block",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Live Dashboard
          </a>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ backgroundColor: "#F7F5F2", borderTop: "1px solid #E0DAD3", padding: "16px 32px 24px", overflow: "hidden" }}
          >
            {links.map((l) => (
              <a
                key={l}
                href="#"
                style={{ display: "block", padding: "10px 0", fontSize: 15, color: "#111", textDecoration: "none", borderBottom: "1px solid #E0DAD3" }}
              >
                {l}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 900px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </header>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const highlights = [
    "Clinically Grounded AI",
    "Real-Time Capacity Intelligence",
    "Safe & Auditable Decisions",
    "Scalable Across Hospitals",
  ];

  return (
    <section style={{ position: "relative", overflow: "hidden" }}>
      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-image-wrap { display: none !important; }
        }
      `}</style>
      <GradientBlob color="#111111" size={520} top={-160} left={-120} opacity={0.045} duration={12} />
      <GradientBlob color="#16A34A" size={420} top={40} right={-140} opacity={0.05} duration={14} />
      <div className="hero-grid" style={{ maxWidth: 1320, margin: "0 auto", padding: "72px 32px 80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", position: "relative", zIndex: 1 }}>
        <div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#111111",
            color: "#F7F5F2",
            borderRadius: 100,
            padding: "5px 14px",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.08em",
            marginBottom: 32,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <PulseDot color="#4ADE80" size={6} />
            AI-POWERED HEALTHCARE INTELLIGENCE
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: "clamp(36px, 4.5vw, 58px)",
            fontWeight: 400,
            lineHeight: 1.1,
            color: "#111111",
            marginBottom: 24,
            letterSpacing: "-0.01em",
          }}>
            AI-Powered Clinical Triage, Hospital Capacity &{" "}
            <em style={{ fontStyle: "italic", color: "#444" }}>Healthcare Decision</em> Intelligence Platform
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            style={{ fontSize: 17, color: "#555", lineHeight: 1.7, marginBottom: 36, maxWidth: 480, fontFamily: "'DM Sans', sans-serif" }}>
            Unify patient intake, clinically grounded triage, safety escalation and real-time hospital capacity optimization into one intelligent decision-support platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            style={{ display: "flex", gap: 12, marginBottom: 40, flexWrap: "wrap" }}>
            <motion.a
              href="/app"
              whileHover={{ scale: 1.03, opacity: 0.9 }}
              whileTap={{ scale: 0.97 }}
              style={{
                backgroundColor: "#111111",
                color: "#F7F5F2",
                border: "none",
                borderRadius: 10,
                padding: "13px 28px",
                fontSize: 15,
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Try Live Dashboard
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.03, borderColor: "#999" }}
              whileTap={{ scale: 0.97 }}
              style={{
                backgroundColor: "transparent",
                color: "#111111",
                border: "1.5px solid #E0DAD3",
                borderRadius: 10,
                padding: "13px 24px",
                fontSize: 15,
                fontWeight: 400,
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <IconPlay /> View Platform Overview
            </motion.button>
          </motion.div>

          <RevealGroup style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }} stagger={0.06}>
            {highlights.map((h) => (
              <motion.div key={h} variants={revealItem} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#444", fontFamily: "'DM Sans', sans-serif" }}>
                <span style={{ color: "#16A34A", flexShrink: 0 }}><IconCheck /></span>
                {h}
              </motion.div>
            ))}
          </RevealGroup>
        </div>

        <motion.div
          className="hero-image-wrap"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          whileHover={{ y: -6 }}
          style={{ position: "relative", borderRadius: 20, overflow: "hidden", aspectRatio: "4/3", boxShadow: "0 32px 80px rgba(0,0,0,0.12)" }}
        >
          <img
            src="https://images.unsplash.com/photo-1666214277657-e60f05c40b04?w=900&h=680&fit=crop&auto=format"
            alt="Medical professionals reviewing AI-powered clinical analytics on hospital monitors"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(0,0,0,0.1) 0%, transparent 60%)",
          }} />
          {/* Floating KPI chips */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{
            position: "absolute",
            top: 20,
            left: 20,
            backgroundColor: "rgba(255,255,255,0.95)",
            borderRadius: 12,
            padding: "12px 18px",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          }}>
            <div style={{ fontSize: 10, color: "#666", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em", marginBottom: 4 }}>TOTAL BEDS</div>
            <div style={{ fontSize: 26, fontFamily: "'DM Serif Display', serif", color: "#111", lineHeight: 1 }}><CountUp value={612} /></div>
          </motion.div>
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            style={{
            position: "absolute",
            top: 20,
            right: 20,
            backgroundColor: "rgba(255,255,255,0.95)",
            borderRadius: 12,
            padding: "12px 18px",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
          }}>
            <div style={{ fontSize: 10, color: "#666", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em", marginBottom: 4 }}>AVAILABLE</div>
            <div style={{ fontSize: 26, fontFamily: "'DM Serif Display', serif", color: "#16A34A", lineHeight: 1 }}><CountUp value={180} /></div>
          </motion.div>
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
            style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            backgroundColor: "#111111",
            borderRadius: 12,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <PulseDot color="#DC2626" size={8} />
            <span style={{ fontSize: 12, color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>7 Critical Alerts Active</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ── Workflow ──────────────────────────────────────────────────────────────────

function Workflow() {
  const steps = [
    { icon: <IconChat />, name: "Understand", desc: "Extract symptoms, duration, severity and patient information from text or voice." },
    { icon: <IconBook />, name: "Ground", desc: "Retrieve verified clinical pathways and medical ontology information." },
    { icon: <IconShieldAlert />, name: "Triage", desc: "Generate urgency classification with confidence and clinical evidence." },
    { icon: <IconShieldCheck />, name: "Guard", desc: "Apply deterministic safety rules and override dangerous AI outputs." },
    { icon: <IconBed />, name: "Allocate", desc: "Match patients to optimal beds and resources using constraint optimization." },
    { icon: <IconRefresh />, name: "Adapt", desc: "Recalculate recommendations when hospital states change in real-time." },
    { icon: <IconFile />, name: "Explain & Audit", desc: "Provide transparent reasoning and complete decision audit history." },
  ];

  return (
    <section style={{ backgroundColor: "#fff", borderTop: "1px solid #E0DAD3", borderBottom: "1px solid #E0DAD3", padding: "80px 32px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#666", letterSpacing: "0.1em", fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>UNIFIED INTELLIGENCE WORKFLOW</p>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 400, color: "#111", marginBottom: 14, letterSpacing: "-0.01em" }}>
              One Intelligent Workflow Connecting Patient Care and Hospital Operations
            </h2>
            <p style={{ fontSize: 16, color: "#666", maxWidth: 540, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
              From patient information to optimal care decisions — clinically grounded at every step.
            </p>
          </div>
        </Reveal>

        <RevealGroup style={{ display: "flex", alignItems: "flex-start", gap: 0, overflowX: "auto", paddingBottom: 8 }} stagger={0.12}>
          {steps.map((s, i) => (
            <motion.div key={s.name} variants={revealItem} style={{ display: "flex", alignItems: "flex-start", flexShrink: 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 150, textAlign: "center" }}>
                <motion.div
                  whileHover={{ backgroundColor: "#111111", color: "#F7F5F2", scale: 1.08, rotate: 4 }}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: "#F7F5F2",
                    border: "1px solid #E0DAD3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#111",
                    marginBottom: 14,
                    cursor: "default",
                  }}
                >
                  {s.icon}
                </motion.div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>{s.name}</div>
                <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{s.desc}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ display: "flex", alignItems: "center", paddingTop: 26, flexShrink: 0, paddingLeft: 4, paddingRight: 4 }}>
                  <motion.svg
                    width="24" height="2" viewBox="0 0 24 2" fill="none"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <path d="M0 1h20" stroke="#E0DAD3" strokeWidth="1.5" strokeDasharray="3 2" />
                    <path d="M20 0l3 1-3 1V0z" fill="#E0DAD3" />
                  </motion.svg>
                </div>
              )}
            </motion.div>
          ))}
        </RevealGroup>

        <RevealGroup style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 40, flexWrap: "wrap" }} stagger={0.05}>
          {["Patient Information", "Clinical Risk", "Safety Escalation", "Resource Allocation", "Continuous Optimization", "Audit Trail"].map((tag, i) => (
            <motion.span key={tag} variants={revealItem} whileHover={{ scale: 1.06 }} style={{
              padding: "4px 12px",
              borderRadius: 100,
              fontSize: 12,
              fontFamily: "'DM Sans', sans-serif",
              backgroundColor: i === 2 ? "#FEE2E2" : i === 4 ? "#DCFCE7" : "#F7F5F2",
              color: i === 2 ? "#DC2626" : i === 4 ? "#16A34A" : "#666",
              border: `1px solid ${i === 2 ? "#FECACA" : i === 4 ? "#BBF7D0" : "#E0DAD3"}`,
            }}>
              {tag}
            </motion.span>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

// ── Platform Modules ──────────────────────────────────────────────────────────

function BedGrid() {
  const beds = [
    { id: "101", status: "available" },
    { id: "102", status: "occupied" },
    { id: "103", status: "cleaning" },
    { id: "104", status: "reserved" },
    { id: "105", status: "reserved" },
    { id: "106", status: "occupied" },
    { id: "107", status: "available" },
    { id: "108", status: "maintenance" },
  ];

  const colors: Record<string, { bg: string; border: string; text: string; label: string }> = {
    available: { bg: "#DCFCE7", border: "#BBF7D0", text: "#15803D", label: "Available" },
    occupied: { bg: "#FEE2E2", border: "#FECACA", text: "#B91C1C", label: "Occupied" },
    cleaning: { bg: "#FEF3C7", border: "#FDE68A", text: "#B45309", label: "Cleaning" },
    reserved: { bg: "#DBEAFE", border: "#BFDBFE", text: "#1D4ED8", label: "Reserved" },
    maintenance: { bg: "#F3F4F6", border: "#E5E7EB", text: "#6B7280", label: "Maintenance" },
  };

  return (
    <div>
      <RevealGroup style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }} stagger={0.04}>
        {beds.map((bed) => {
          const c = colors[bed.status];
          return (
            <motion.div
              key={bed.id}
              variants={revealItem}
              whileHover={{ scale: 1.06, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}
              style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "14px 10px", textAlign: "center", cursor: "pointer" }}
            >
              <div style={{ fontSize: 16, fontFamily: "'DM Serif Display', serif", color: c.text, lineHeight: 1 }}>{bed.id}</div>
              <div style={{ fontSize: 10, color: c.text, fontFamily: "'DM Sans', sans-serif", marginTop: 4, opacity: 0.8 }}>{c.label}</div>
            </motion.div>
          );
        })}
      </RevealGroup>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {Object.entries(colors).map(([k, v]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#666", fontFamily: "'DM Sans', sans-serif" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: v.bg, border: `1px solid ${v.border}` }} />
            {v.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditTable() {
  const rows = [
    { id: "DEC-4821", patient: "John Doe", ai: "ICU Bed (CCU)", safety: "TRIGGERED", bed: "ICU Bed 102", approved: "Dr. Sarah J.", time: "10:24 AM" },
    { id: "DEC-4820", patient: "Mary Johnson", ai: "Step-down Bed", safety: "None", bed: "Step-down 12B", approved: "Dr. Alex M.", time: "09:59 AM" },
    { id: "DEC-4819", patient: "Robert Brown", ai: "General Ward Bed", safety: "None", bed: "General 3A", approved: "Nurse Lisa", time: "09:41 AM" },
    { id: "DEC-4818", patient: "Emily Davis", ai: "ICU Bed", safety: "TRIGGERED", bed: "ICU Bed 101", approved: "Dr. Sarah J.", time: "09:12 AM" },
    { id: "DEC-4817", patient: "Michael Lee", ai: "General Ward Bed", safety: "None", bed: "General 2B", approved: "Dr. Alex M.", time: "08:55 AM" },
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #E0DAD3" }}>
            {["Decision ID", "Patient", "AI Recommendation", "Safety Trigger", "Assigned Bed", "Clinician Approval", "Timestamp"].map((h) => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#666", fontWeight: 500, fontSize: 11, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <motion.tr
              key={r.id}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              whileHover={{ backgroundColor: "#F7F5F2" }}
              style={{ borderBottom: "1px solid #F0EDE9" }}
            >
              <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#444" }}>{r.id}</td>
              <td style={{ padding: "10px 12px", fontWeight: 500, color: "#111" }}>{r.patient}</td>
              <td style={{ padding: "10px 12px", color: "#444" }}>{r.ai}</td>
              <td style={{ padding: "10px 12px" }}>
                {r.safety === "TRIGGERED"
                  ? <span style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", borderRadius: 4, padding: "2px 7px", fontSize: 10, fontWeight: 600 }}>TRIGGERED</span>
                  : <span style={{ color: "#9CA3AF" }}>—</span>}
              </td>
              <td style={{ padding: "10px 12px", color: "#111", fontWeight: 500 }}>{r.bed}</td>
              <td style={{ padding: "10px 12px", color: "#444" }}>{r.approved}</td>
              <td style={{ padding: "10px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#666" }}>{r.time}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlatformModules() {
  const [active, setActive] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const tabs = ["Clinical Triage & Risk", "Bed & Resource Optimizer", "Real-Time State Intelligence", "Explainable AI & Audit"];

  const modules = [
    {
      label: "A",
      title: "Autonomous Clinical Triage & Risk Escalation",
      desc: "Convert unstructured patient complaints into structured clinical data, ground them in medical ontology, and apply deterministic safety guardrails before escalation.",
      features: [
        "Conversational patient intake (text / voice)",
        "Structured symptom extraction & classification",
        "Medical ontology grounding",
        "Clinical pathway retrieval",
        "Triage confidence scoring",
        "Deterministic red-flag overrides",
        "Clinician audit dashboard",
      ],
      preview: (
        <div style={{ backgroundColor: "#F7F5F2", borderRadius: 12, padding: 20 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#E0DAD3", flexShrink: 0 }} />
            <div style={{ backgroundColor: "#fff", border: "1px solid #E0DAD3", borderRadius: 12, borderBottomLeftRadius: 4, padding: "10px 14px", fontSize: 13, color: "#111", maxWidth: 280, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
              Severe chest pain and shortness of breath since 2 hours, profuse sweating
            </div>
          </div>
          <div style={{ backgroundColor: "#fff", border: "1px solid #E0DAD3", borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#666", letterSpacing: "0.08em", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>EXTRACTED ENTITIES</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {["Chest pain", "Shortness of breath", "Diaphoresis", "Duration: 2hrs"].map((t) => (
                <span key={t} style={{ backgroundColor: "#F7F5F2", border: "1px solid #E0DAD3", borderRadius: 6, padding: "3px 9px", fontSize: 11, color: "#444", fontFamily: "'DM Sans', sans-serif" }}>{t}</span>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#666", fontFamily: "'DM Sans', sans-serif" }}>Severity: <strong style={{ color: "#DC2626" }}>High</strong> · Pain Scale: 8/10</div>
          </div>
          <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: "#DC2626", flexShrink: 0, marginTop: 1 }}><IconAlert /></span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#B91C1C", fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>RED FLAG TRIGGERED</div>
              <div style={{ fontSize: 11, color: "#DC2626", fontFamily: "'DM Sans', sans-serif" }}>Possible Acute Coronary Syndrome — Immediate emergency escalation</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "B",
      title: "Dynamic Bed & Resource Optimization",
      desc: "Find the most appropriate bed or resource using advanced constraint satisfaction — matching ICU requirements, specialist availability, equipment, and proximity.",
      features: [
        "Patient-bed compatibility scoring",
        "ICU allocation & isolation matching",
        "Equipment availability tracking",
        "Specialist availability matrix",
        "Hard & soft constraint evaluation",
        "Min-cost flow optimization engine",
        "Real-time reallocation & optimization",
      ],
      preview: (
        <div>
          <BedGrid />
          <button
            onClick={() => setShowModal(true)}
            style={{
              marginTop: 16,
              backgroundColor: "#111",
              color: "#F7F5F2",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <IconEye /> Explain Recommendation
          </button>
        </div>
      ),
    },
    {
      label: "C",
      title: "Real-Time Hospital State Intelligence",
      desc: "Maintain a live, normalized view of hospital resources and events to keep all decisions aligned with current reality through WebSocket updates.",
      features: [
        "Normalized bed/resource state tracking",
        "Event-driven updates (admit, discharge, maintenance)",
        "WebSocket dashboards & real-time alerts",
        "High-frequency event batching",
        "Predictive capacity & demand insights",
        "Role-based access & audit logs",
      ],
      preview: (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Available", value: 180, color: "#16A34A", bg: "#DCFCE7" },
              { label: "Occupied", value: 432, color: "#DC2626", bg: "#FEE2E2" },
              { label: "Cleaning", value: 32, color: "#EA580C", bg: "#FEF3C7" },
              { label: "Reserved", value: 24, color: "#2563EB", bg: "#DBEAFE" },
              { label: "Maintenance", value: 12, color: "#6B7280", bg: "#F3F4F6" },
              { label: "Total", value: 612, color: "#111", bg: "#F7F5F2" },
            ].map((s) => (
              <div key={s.label} style={{ backgroundColor: s.bg, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 11, color: s.color, fontFamily: "'DM Sans', sans-serif", opacity: 0.8, marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontFamily: "'DM Serif Display', serif", color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: "#F7F5F2", borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#111", fontFamily: "'DM Sans', sans-serif" }}>Live Event Stream</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#16A34A", fontFamily: "'DM Sans', sans-serif" }}>
                <span className="live-dot" style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#16A34A", display: "inline-block" }} /> Live
              </span>
            </div>
            {["Bed 103 → Cleaning", "John Doe admitted ICU-102", "Ambulance ETA 12 min"].map((ev) => (
              <div key={ev} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #E0DAD3", fontSize: 12, color: "#444", fontFamily: "'DM Sans', sans-serif" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#16A34A", flexShrink: 0 }} />
                {ev}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: "D",
      title: "Explainable AI & Audit Intelligence",
      desc: "Every AI decision is explainable, traceable and reviewable. Maintain complete evidence chains, rule triggers, and allocation rationale for clinical governance.",
      features: [],
      preview: <AuditTable />,
    },
  ];

  return (
    <section style={{ padding: "80px 32px", maxWidth: 1320, margin: "0 auto" }}>
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#666", letterSpacing: "0.1em", fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>PLATFORM MODULES</p>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 400, color: "#111", marginBottom: 14, letterSpacing: "-0.01em" }}>
            Integrated Modules for Healthcare Intelligence
          </h2>
          <p style={{ fontSize: 16, color: "#666", maxWidth: 480, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
            Integrated modules working together for intelligent healthcare operations.
          </p>
        </div>
      </Reveal>

      <div style={{ display: "flex", gap: 8, marginBottom: 32, overflowX: "auto", paddingBottom: 4 }}>
        {tabs.map((t, i) => (
          <motion.button
            key={t}
            onClick={() => setActive(i)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "9px 18px",
              borderRadius: 8,
              border: active === i ? "1px solid #111" : "1px solid #E0DAD3",
              backgroundColor: active === i ? "#111" : "#fff",
              color: active === i ? "#F7F5F2" : "#666",
              fontSize: 13,
              fontWeight: 500,
              fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {t}
          </motion.button>
        ))}
      </div>

      {modules[active] && (
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, backgroundColor: "#fff", border: "1px solid #E0DAD3", borderRadius: 20, padding: 40 }}
          className="module-grid"
        >
          <style>{`@media (max-width: 900px) { .module-grid { grid-template-columns: 1fr !important; } }`}</style>
          <div>
            <div style={{ display: "inline-block", backgroundColor: "#F7F5F2", border: "1px solid #E0DAD3", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 700, color: "#111", marginBottom: 16, fontFamily: "'JetBrains Mono', monospace" }}>
              Module {modules[active].label}
            </div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, fontWeight: 400, color: "#111", marginBottom: 14, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              {modules[active].title}
            </h3>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.7, marginBottom: 24, fontFamily: "'DM Sans', sans-serif" }}>
              {modules[active].desc}
            </p>
            {modules[active].features.length > 0 && (
              <RevealGroup style={{ display: "flex", flexDirection: "column", gap: 8 }} stagger={0.05}>
                {modules[active].features.map((f) => (
                  <motion.div key={f} variants={revealItem} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#444", fontFamily: "'DM Sans', sans-serif" }}>
                    <span style={{ color: "#16A34A", flexShrink: 0 }}><IconCheck /></span>
                    {f}
                  </motion.div>
                ))}
              </RevealGroup>
            )}
          </div>
          <div>{modules[active].preview}</div>
        </motion.div>
      )}

      {/* Explain Recommendation Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.25 }}
              style={{ backgroundColor: "#fff", borderRadius: 20, padding: 36, maxWidth: 440, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#666", letterSpacing: "0.08em", fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>AI RECOMMENDATION RATIONALE</div>
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#111" }}>Why ICU-204 Was Selected</h3>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#666", padding: 4 }}><IconX /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {["ICU requirement matched", "Cardiologist On Duty (Dr. Chen)", "Ventilator available at station", "Closest nursing station (32m)"].map((r, i) => (
                  <motion.div
                    key={r}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10 }}
                  >
                    <span style={{ color: "#16A34A" }}><IconCheck /></span>
                    <span style={{ fontSize: 13, color: "#166534", fontFamily: "'DM Sans', sans-serif" }}>{r}</span>
                  </motion.div>
                ))}
              </div>
              <div style={{ backgroundColor: "#F7F5F2", borderRadius: 10, padding: 14, fontSize: 12, color: "#666", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
                <strong style={{ color: "#111" }}>Evidence:</strong> ESC ACS Guidelines 2023 · SNOMED CT: 29997009 · ESI Algorithm Level 1
              </div>
              <motion.button
                whileHover={{ opacity: 0.85 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowModal(false)}
                style={{ width: "100%", marginTop: 20, backgroundColor: "#111", color: "#F7F5F2", border: "none", borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}
              >
                Accept Recommendation
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ── Live Command Center ───────────────────────────────────────────────────────

function CapacityChart() {
  const data = [
    { day: "May 05", pct: 68 }, { day: "May 06", pct: 72 }, { day: "May 07", pct: 71 },
    { day: "May 08", pct: 75 }, { day: "May 09", pct: 73 }, { day: "May 10", pct: 74 }, { day: "May 11", pct: 71 },
  ];
  const w = 400; const h = 120;
  const pad = { t: 10, r: 10, b: 24, l: 30 };
  const minY = 0; const maxY = 100;
  const cw = w - pad.l - pad.r; const ch = h - pad.t - pad.b;

  const pts = data.map((d, i) => ({
    x: pad.l + (i / (data.length - 1)) * cw,
    y: pad.t + ch - ((d.pct - minY) / (maxY - minY)) * ch,
    day: d.day,
    pct: d.pct,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${pad.t + ch} L ${pts[0].x} ${pad.t + ch} Z`;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", minWidth: 280, height: "auto" }}>
        {[0, 25, 50, 75, 100].map((v) => {
          const y = pad.t + ch - (v / maxY) * ch;
          return (
            <g key={v}>
              <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#E0DAD3" strokeWidth="0.5" />
              <text x={pad.l - 4} y={y + 4} fontSize="8" fill="#aaa" textAnchor="end">{v}%</text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#111111" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#111111" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <motion.path
          d={areaD}
          fill="url(#areaGrad)"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        />
        <motion.path
          d={pathD}
          fill="none"
          stroke="#111111"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
        {pts.map((p, i) => (
          <motion.g
            key={p.day}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 300 }}
          >
            <circle cx={p.x} cy={p.y} r="3" fill="#111" />
            <text x={p.x} y={pad.t + ch + 16} fontSize="8" fill="#aaa" textAnchor="middle">{p.day.replace("May ", "")}</text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}

function CommandCenter() {
  const kpis = [
    { label: "Total Beds", value: 612, sub: "All Hospitals", color: "#111" },
    { label: "Occupied", value: 432, sub: "70.6%", color: "#DC2626" },
    { label: "Available", value: 180, sub: "29.4%", color: "#16A34A" },
    { label: "Active Patients", value: 1248, sub: "Currently Admitted", color: "#111" },
    { label: "Ambulances Active", value: 24, sub: "On Field", color: "#2563EB" },
    { label: "Critical Alerts", value: 7, sub: "Requires Action", color: "#DC2626", alert: true },
  ];

  const departments = [
    { name: "ICU", occupied: 48, available: 12, pct: 80 },
    { name: "General Ward", occupied: 256, available: 94, pct: 73 },
    { name: "Pediatric", occupied: 62, available: 18, pct: 78 },
    { name: "Maternity", occupied: 28, available: 20, pct: 58 },
    { name: "Isolation", occupied: 38, available: 12, pct: 76 },
  ];

  const getBarColor = (pct: number) => pct >= 80 ? "#DC2626" : pct >= 70 ? "#EA580C" : "#16A34A";

  return (
    <section style={{ backgroundColor: "#fff", borderTop: "1px solid #E0DAD3", borderBottom: "1px solid #E0DAD3", padding: "80px 32px", position: "relative", overflow: "hidden" }}>
      <GradientBlob color="#2563EB" size={380} bottom={-140} right={-100} opacity={0.04} duration={13} />
      <div style={{ maxWidth: 1320, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <Reveal>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#666", letterSpacing: "0.1em", fontFamily: "'DM Sans', sans-serif", marginBottom: 8 }}>LIVE HOSPITAL COMMAND CENTER</p>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(24px, 2.5vw, 34px)", fontWeight: 400, color: "#111", letterSpacing: "-0.01em" }}>
                Real-Time Capacity Snapshot
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#16A34A", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
              <PulseDot color="#16A34A" size={8} />
              Live · Updated 2s ago
            </div>
          </div>
        </Reveal>

        {/* KPI row */}
        <style>{`@media (max-width: 900px) { .kpi-grid-outer { grid-template-columns: repeat(3, 1fr) !important; } }`}</style>
        <RevealGroup className="kpi-grid-outer" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 32 }} stagger={0.06}>
          {kpis.map((k) => (
            <motion.div key={k.label} variants={revealItem} whileHover={{ y: -3, boxShadow: "0 10px 24px rgba(0,0,0,0.06)" }} style={{
              backgroundColor: k.alert ? "#FEF2F2" : "#F7F5F2",
              border: `1px solid ${k.alert ? "#FECACA" : "#E0DAD3"}`,
              borderRadius: 14,
              padding: "18px 16px",
            }}>
              <div style={{ fontSize: 10, color: "#666", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em", marginBottom: 6 }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 28, fontFamily: "'DM Serif Display', serif", color: k.color, lineHeight: 1, marginBottom: 4 }}>
                <CountUp value={k.value} />
              </div>
              <div style={{ fontSize: 11, color: k.alert ? "#DC2626" : "#888", fontFamily: "'DM Sans', sans-serif" }}>{k.sub}</div>
            </motion.div>
          ))}
        </RevealGroup>

        {/* Charts + Table */}
        <style>{`@media (max-width: 900px) { .chart-grid-outer { grid-template-columns: 1fr !important; } }`}</style>
        <div className="chart-grid-outer" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
          <Reveal delay={0.1}>
            <div style={{ backgroundColor: "#F7F5F2", border: "1px solid #E0DAD3", borderRadius: 16, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#111" }}>Capacity Trend (7 Days)</h4>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#EA580C", fontWeight: 500 }}>71% avg</span>
              </div>
              <CapacityChart />
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div style={{ backgroundColor: "#F7F5F2", border: "1px solid #E0DAD3", borderRadius: 16, padding: 24 }}>
              <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 16 }}>Top Departments</h4>
              <div style={{ fontSize: 11, color: "#666", fontFamily: "'DM Sans', sans-serif", display: "grid", gridTemplateColumns: "1fr 60px 60px 90px", gap: "0 8px", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #E0DAD3" }}>
                <span>Department</span><span style={{ textAlign: "right" }}>Occ.</span><span style={{ textAlign: "right" }}>Avail.</span><span>Occupancy</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {departments.map((d, i) => (
                  <div key={d.name} style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 90px", gap: "0 8px", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#111", fontWeight: 500 }}>{d.name}</span>
                    <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: "#DC2626", textAlign: "right" }}>{d.occupied}</span>
                    <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: "#16A34A", textAlign: "right" }}>{d.available}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 6, backgroundColor: "#E0DAD3", borderRadius: 3, overflow: "hidden" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${d.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                          style={{ height: "100%", backgroundColor: getBarColor(d.pct), borderRadius: 3 }}
                        />
                      </div>
                      <span style={{ fontSize: 11, color: "#666", fontFamily: "'JetBrains Mono', monospace", minWidth: 28 }}>{d.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── Suite Showcase ────────────────────────────────────────────────────────────

function ScreenCard({ title, children, dark = false }: { title: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <HoverCard style={{
      backgroundColor: dark ? "#111" : "#fff",
      border: `1px solid ${dark ? "#2a2a2a" : "#E0DAD3"}`,
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
    }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${dark ? "#2a2a2a" : "#E0DAD3"}`, display: "flex", alignItems: "center", gap: 6 }}>
        {["#DC2626", "#EA580C", "#16A34A"].map((c) => (
          <span key={c} style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: c, opacity: 0.7 }} />
        ))}
        <span style={{ marginLeft: 8, fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: dark ? "#666" : "#aaa" }}>{title}</span>
      </div>
      <div style={{ padding: 16 }}>
        {children}
      </div>
    </HoverCard>
  );
}

function SuiteShowcase() {
  const screens = [
    {
      title: "Hospital Admin Console",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ backgroundColor: "#F7F5F2", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#999", fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>HOSPITAL PROFILE</div>
            <div style={{ fontSize: 13, color: "#111", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>City General Hospital</div>
            <div style={{ fontSize: 11, color: "#666", fontFamily: "'DM Sans', sans-serif" }}>Level 1 Trauma · 612 Beds · 18 Departments</div>
          </div>
          {["ICU — 60 beds", "General Ward — 350 beds", "Pediatrics — 80 beds"].map((d) => (
            <div key={d} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#F7F5F2", borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: "#444", fontFamily: "'DM Sans', sans-serif" }}>{d}</span>
              <span style={{ fontSize: 10, color: "#16A34A", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>ACTIVE</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Patient Intake & AI Triage",
      content: (
        <div>
          <div style={{ backgroundColor: "#F7F5F2", borderRadius: 8, padding: "8px 12px", marginBottom: 8, fontSize: 12, color: "#444", fontFamily: "'DM Sans', sans-serif", fontStyle: "italic" }}>
            "Severe chest pain and shortness of breath"
          </div>
          <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>AI EXTRACTION</div>
            <div style={{ fontSize: 11, color: "#166534", fontFamily: "'DM Sans', sans-serif" }}>Symptoms: Chest pain, Breathing difficulty · Severity: High</div>
          </div>
          <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#B91C1C", fontFamily: "'DM Sans', sans-serif" }}>🔴 RED FLAG TRIGGERED</div>
            <div style={{ fontSize: 11, color: "#DC2626", fontFamily: "'DM Sans', sans-serif" }}>Immediate emergency escalation required</div>
          </div>
        </div>
      ),
    },
    {
      title: "Ambulance Dispatch Map",
      content: (
        <div>
          <div style={{ backgroundColor: "#1a1a2e", borderRadius: 10, height: 100, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
            {/* Simplified map visualization */}
            <svg width="100%" height="100%" viewBox="0 0 260 100" style={{ position: "absolute", inset: 0 }}>
              <rect width="260" height="100" fill="#1a1a2e" />
              {/* Grid lines */}
              {[20,40,60,80].map(y => <line key={y} x1="0" y1={y} x2="260" y2={y} stroke="#ffffff08" strokeWidth="1" />)}
              {[40,80,120,160,200].map(x => <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="#ffffff08" strokeWidth="1" />)}
              {/* Route line */}
              <path d="M 40 70 Q 120 20 200 40" stroke="#EA580C" strokeWidth="2" fill="none" strokeDasharray="4 2" />
              {/* Ambulance dot */}
              <circle cx="40" cy="70" r="5" fill="#EA580C" />
              {/* Hospital dot */}
              <circle cx="200" cy="40" r="6" fill="#16A34A" />
              <circle cx="200" cy="40" r="12" fill="#16A34A" fillOpacity="0.2" />
            </svg>
          </div>
          <div style={{ backgroundColor: "#F7F5F2", borderRadius: 8, padding: "8px 12px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#111", fontFamily: "'DM Sans', sans-serif" }}>City General Hospital</div>
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: "#666", fontFamily: "'DM Sans', sans-serif" }}>4.2 km · 12 min ETA</span>
              <span style={{ fontSize: 11, color: "#16A34A", fontFamily: "'DM Sans', sans-serif" }}>ICU: 2 beds avail.</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Interactive Bed Optimizer",
      content: (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
            {[
              { n: "101", s: "available", bg: "#DCFCE7", c: "#15803D" },
              { n: "102", s: "occupied", bg: "#FEE2E2", c: "#B91C1C" },
              { n: "103", s: "cleaning", bg: "#FEF3C7", c: "#B45309" },
              { n: "104", s: "reserved", bg: "#DBEAFE", c: "#1D4ED8" },
            ].map((b) => (
              <div key={b.n} style={{ backgroundColor: b.bg, borderRadius: 8, padding: "10px 6px", textAlign: "center" }}>
                <div style={{ fontSize: 14, fontFamily: "'DM Serif Display', serif", color: b.c }}>{b.n}</div>
                <div style={{ fontSize: 9, color: b.c, fontFamily: "'DM Sans', sans-serif", opacity: 0.8 }}>{b.s}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", backgroundColor: "#111", borderRadius: 8, cursor: "pointer" }}>
            <IconEye />
            <span style={{ fontSize: 11, color: "#F7F5F2", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>Explain Recommendation</span>
          </div>
        </div>
      ),
    },
    {
      title: "Patient Health Record Dashboard",
      dark: true,
      content: (
        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: "#2a2a2a", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 12, color: "#aaa" }}>JS</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "'DM Sans', sans-serif" }}>Jane Smith</div>
              <div style={{ fontSize: 11, color: "#888", fontFamily: "'DM Sans', sans-serif" }}>34F · MRN: HF-62031</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {["CT Scan (Chest)", "X-Ray (Chest)", "Blood Panel"].map((r) => (
              <div key={r} style={{ backgroundColor: "#1a1a1a", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ width: 28, height: 28, backgroundColor: "#2a2a2a", borderRadius: 6, margin: "0 auto 6px" }} />
                <div style={{ fontSize: 10, color: "#888", fontFamily: "'DM Sans', sans-serif" }}>{r}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, backgroundColor: "#1a1a1a", borderRadius: 8, padding: 10 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {[70, 60, 75, 65, 80, 72, 68].map((h, i) => (
                <div key={i} style={{ flex: 1, height: h / 4, backgroundColor: "#333", borderRadius: 2, alignSelf: "flex-end" }} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: "#666", fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>Vitals trend — 7 days</div>
          </div>
        </div>
      ),
    },
    {
      title: "Audit Decision Log",
      content: (
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10, alignItems: "center" }}>
            <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#111", fontFamily: "'DM Sans', sans-serif" }}>Decision History</span>
            <button style={{ display: "flex", alignItems: "center", gap: 4, background: "#F7F5F2", border: "1px solid #E0DAD3", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#666", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              <IconFilter /> Filter
            </button>
          </div>
          {[
            { id: "DEC-4821", patient: "John Doe", flag: true, time: "10:24" },
            { id: "DEC-4820", patient: "Mary Johnson", flag: false, time: "09:59" },
            { id: "DEC-4819", patient: "Robert Brown", flag: false, time: "09:41" },
          ].map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid #F0EDE9" }}>
              <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#666", minWidth: 64 }}>{r.id}</span>
              <span style={{ fontSize: 12, color: "#111", fontFamily: "'DM Sans', sans-serif", flex: 1 }}>{r.patient}</span>
              {r.flag && <span style={{ backgroundColor: "#FEE2E2", color: "#B91C1C", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>FLAGGED</span>}
              <span style={{ fontSize: 10, color: "#aaa", fontFamily: "'JetBrains Mono', monospace" }}>{r.time}</span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: "#888", fontFamily: "'DM Sans', sans-serif", textAlign: "center", marginTop: 8 }}>
            Showing 3 of 246 entries
          </div>
        </div>
      ),
    },
  ];

  return (
    <section style={{ padding: "80px 32px", maxWidth: 1320, margin: "0 auto" }}>
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#666", letterSpacing: "0.1em", fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>COMPLETE PLATFORM</p>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 400, color: "#111", marginBottom: 14, letterSpacing: "-0.01em" }}>
            Complete Healthcare Intelligence Suite
          </h2>
          <p style={{ fontSize: 16, color: "#666", maxWidth: 480, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
            Six purpose-built interfaces, unified under one intelligent platform.
          </p>
        </div>
      </Reveal>

      <style>{`@media (max-width: 900px) { .suite-grid-outer { grid-template-columns: 1fr 1fr !important; } } @media (max-width: 600px) { .suite-grid-outer { grid-template-columns: 1fr !important; } }`}</style>
      <RevealGroup className="suite-grid-outer" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} stagger={0.08}>
        {screens.map((s) => (
          <motion.div key={s.title} variants={revealItem}>
            <ScreenCard title={s.title} dark={s.dark}>
              {s.content}
            </ScreenCard>
          </motion.div>
        ))}
      </RevealGroup>
    </section>
  );
}

// ── Why HealthFlow AI ─────────────────────────────────────────────────────────

function WhySection() {
  const pillars = [
    { icon: <IconBrain />, title: "Evidence-Based AI", desc: "Grounded in verified medical ontology & clinical pathways. Every recommendation traces to published guidelines." },
    { icon: <IconShieldCheck />, title: "Safety First", desc: "Deterministic guardrails for critical conditions. AI outputs are overridden before reaching clinicians when red flags fire." },
    { icon: <IconActivity />, title: "Real-Time Intelligence", desc: "Always synchronized with live hospital operations through WebSocket event streams and high-frequency state updates." },
    { icon: <IconBed />, title: "Optimized Decisions", desc: "Advanced constraint-satisfaction algorithms for better resource utilization across beds, equipment, and specialists." },
    { icon: <IconFile />, title: "Transparent & Auditable", desc: "Explainable AI with complete decision audit trails. Every allocation rationale is stored, traceable, and reviewable." },
  ];

  return (
    <section style={{ backgroundColor: "#fff", borderTop: "1px solid #E0DAD3", padding: "80px 32px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#666", letterSpacing: "0.1em", fontFamily: "'DM Sans', sans-serif", marginBottom: 12 }}>WHY HEALTHFLOW AI</p>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(26px, 3vw, 38px)", fontWeight: 400, color: "#111", letterSpacing: "-0.01em" }}>
              Built for the Highest Stakes Environment
            </h2>
          </div>
        </Reveal>

        <style>{`@media (max-width: 900px) { .why-grid-outer { grid-template-columns: repeat(2, 1fr) !important; } } @media (max-width: 500px) { .why-grid-outer { grid-template-columns: 1fr !important; } }`}</style>
        <RevealGroup className="why-grid-outer" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 24 }} stagger={0.08}>
          {pillars.map((p) => (
            <motion.div key={p.title} variants={revealItem} style={{ textAlign: "center" }}>
              <motion.div
                whileHover={{ scale: 1.1, rotate: -4, backgroundColor: "#111", color: "#F7F5F2" }}
                style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: "#F7F5F2", border: "1px solid #E0DAD3", display: "flex", alignItems: "center", justifyContent: "center", color: "#111", margin: "0 auto 16px" }}
              >
                {p.icon}
              </motion.div>
              <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 10 }}>{p.title}</h4>
              <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{p.desc}</p>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

// ── Stats Band ────────────────────────────────────────────────────────────────

function StatsBand() {
  const stats = [
    { val: 99.7, suffix: "%", decimals: 1, label: "Triage Accuracy" },
    { val: 2, suffix: "s", prefix: "< ", label: "Decision Latency" },
    { val: 40, suffix: "%", label: "Reduced Wait Times" },
    { val: 612, suffix: "+", label: "Beds Monitored Live" },
  ];

  return (
    <div style={{ backgroundColor: "#111", padding: "48px 32px", position: "relative", overflow: "hidden" }}>
      <GradientBlob color="#ffffff" size={400} top={-180} left={"40%"} opacity={0.03} duration={16} />
      <style>{`@media (max-width: 700px) { .stats-band-outer { grid-template-columns: repeat(2, 1fr) !important; } }`}</style>
      <RevealGroup className="stats-band-outer" style={{ maxWidth: 1320, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, position: "relative", zIndex: 1 }} stagger={0.1}>
        {stats.map((s) => (
          <motion.div key={s.label} variants={revealItem} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 3.5vw, 48px)", color: "#F7F5F2", marginBottom: 6 }}>
              {(s as any).prefix || ""}<CountUp value={s.val} suffix={s.suffix} decimals={(s as any).decimals || 0} />
            </div>
            <div style={{ fontSize: 13, color: "#777", fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
          </motion.div>
        ))}
      </RevealGroup>
    </div>
  );
}

// ── CTA ───────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section style={{ padding: "0 32px 80px", maxWidth: 1320, margin: "0 auto" }}>
      <Reveal y={30}>
        <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", minHeight: 360, display: "flex", alignItems: "center" }}>
          <img
            src="https://images.unsplash.com/photo-1688565631550-ff8aa569f71a?w=1400&h=500&fit=crop&auto=format"
            alt="Medical professional reviewing healthcare analytics on a monitoring system"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.2) 100%)" }} />
          <ScanSweep />
          <div style={{ position: "relative", zIndex: 1, padding: "56px 56px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#aaa", letterSpacing: "0.1em", fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>START TODAY</p>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 400, color: "#fff", marginBottom: 20, maxWidth: 560, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              Transform Healthcare Operations With Intelligent Decision Support
            </h2>
            <p style={{ fontSize: 16, color: "#ccc", marginBottom: 36, maxWidth: 440, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
              Join hospitals leveraging AI-powered triage and capacity intelligence to improve patient outcomes and operational efficiency.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <motion.a
                href="/app"
                whileHover={{ scale: 1.03, opacity: 0.9 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  backgroundColor: "#fff",
                  color: "#111",
                  border: "none",
                  borderRadius: 10,
                  padding: "14px 32px",
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Try Live Dashboard
              </motion.a>
              <motion.button
                whileHover={{ scale: 1.03, borderColor: "rgba(255,255,255,0.8)" }}
                whileTap={{ scale: 0.97 }}
                style={{
                  backgroundColor: "transparent",
                  color: "#fff",
                  border: "1.5px solid rgba(255,255,255,0.4)",
                  borderRadius: 10,
                  padding: "14px 28px",
                  fontSize: 15,
                  fontWeight: 400,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                }}
              >
                View Platform Overview
              </motion.button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  const cols = [
    { heading: "Platform", links: ["Overview", "Modules", "How It Works", "Pricing"] },
    { heading: "Solutions", links: ["Hospitals", "Health Systems", "Emergency Care", "Capacity Management"] },
    { heading: "Resources", links: ["Documentation", "Case Studies", "Blog", "Whitepapers"] },
    { heading: "Company", links: ["About Us", "Careers", "Contact Us", "Request Demo"] },
  ];

  return (
    <footer style={{ borderTop: "1px solid #E0DAD3", backgroundColor: "#F7F5F2" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "56px 32px 32px" }}>
        <style>{`@media (max-width: 900px) { .footer-grid-outer { grid-template-columns: 1fr 1fr !important; } }`}</style>
        <div className="footer-grid-outer" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
            <div>
              <a href="#" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#111", marginBottom: 16 }}>
                <Logo />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, letterSpacing: "0.04em" }}>HEALTHFLOW AI</span>
              </a>
              <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, maxWidth: 280, fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }}>
                AI-Powered Clinical Triage, Hospital Capacity & Healthcare Decision Intelligence Platform.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                {["in", "tw", "yt"].map((s) => (
                  <a key={s} href="#" style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: "1px solid #E0DAD3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    color: "#666",
                    textDecoration: "none",
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    transition: "all 0.15s",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#111"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#111"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#E0DAD3"; }}
                  >{s}</a>
                ))}
              </div>
            </div>

            {cols.map((c) => (
              <div key={c.heading}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#111", letterSpacing: "0.08em", fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>{c.heading.toUpperCase()}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {c.links.map((l) => (
                    <a key={l} href="#" style={{ fontSize: 13, color: "#666", textDecoration: "none", fontFamily: "'DM Sans', sans-serif", transition: "color 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#111")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
                    >{l}</a>
                  ))}
                </div>
              </div>
            ))}
        </div>

        <div style={{ borderTop: "1px solid #E0DAD3", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#aaa", fontFamily: "'DM Sans', sans-serif" }}>© 2024 HealthFlow AI. All rights reserved.</span>
          <div style={{ display: "flex", gap: 24 }}>
            {["Privacy Policy", "Terms of Service"].map((l) => (
              <a key={l} href="#" style={{ fontSize: 12, color: "#aaa", textDecoration: "none", fontFamily: "'DM Sans', sans-serif", transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#111")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#aaa")}
              >{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F7F5F2" }}>
      <Nav />
      <Hero />
      <Workflow />
      <PlatformModules />
      <CommandCenter />
      <SuiteShowcase />
      <WhySection />
      <StatsBand />
      <CTA />
      <Footer />
    </div>
  );
}
