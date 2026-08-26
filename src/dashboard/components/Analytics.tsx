import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api";
import type { AnalyticsSummary, ForecastResponse } from "../types";
import { theme, esiColors } from "../theme";
import { Reveal, RevealGroup, revealItem, CountUp, PulseDot } from "../../shared/motion";

function EsiDonut({ distribution }: { distribution: Record<string, number> }) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (total === 0) {
    return (
      <div style={{ width: 160, height: 160, borderRadius: "50%", border: `10px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: theme.faint, fontFamily: theme.sans, fontSize: 12 }}>
        No data
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: 160, height: 160 }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#F0EDE9" strokeWidth="14" />
        {[1, 2, 3, 4, 5].map((level) => {
          const count = distribution[String(level)] || 0;
          if (count === 0) return null;
          const fraction = count / total;
          const dash = fraction * circumference;
          const c = esiColors[level];
          const el = (
            <motion.circle
              key={level}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={c.fg}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              transform="rotate(-90 80 80)"
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 26, fontFamily: theme.serif, color: theme.ink, lineHeight: 1 }}>
          <CountUp value={total} />
        </div>
        <div style={{ fontSize: 10, color: theme.faint, fontFamily: theme.sans }}>PATIENTS</div>
      </div>
    </div>
  );
}

function ForecastChart({ data }: { data: ForecastResponse }) {
  const all = [...data.history, ...data.forecast];
  const w = 640;
  const h = 200;
  const pad = { l: 30, r: 10, t: 14, b: 24 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const maxY = Math.max(...all.map((p) => p.value), 1) * 1.2;

  const historyLen = data.history.length;
  const pointX = (i: number) => pad.l + (i / (all.length - 1)) * cw;
  const pointY = (v: number) => pad.t + ch - (v / maxY) * ch;

  const historyPath = data.history.map((p, i) => `${i === 0 ? "M" : "L"}${pointX(i)},${pointY(p.value)}`).join(" ");
  const forecastPath = data.forecast
    .map((p, i) => `${i === 0 ? "M" : "L"}${pointX(historyLen - 1 + i + 1)},${pointY(p.value)}`)
    .join(" ")
    .replace("M", `M${pointX(historyLen - 1)},${pointY(data.history[historyLen - 1].value)} L`);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto" }}>
      {[0, 0.5, 1].map((frac) => {
        const y = pad.t + ch - frac * ch;
        return <line key={frac} x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#E0DAD3" strokeWidth="0.5" />;
      })}
      <motion.line
        x1={pointX(historyLen - 1)}
        y1={pad.t}
        x2={pointX(historyLen - 1)}
        y2={pad.t + ch}
        stroke="#111"
        strokeWidth="1"
        strokeDasharray="2 3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.5 }}
      />
      <motion.path d={historyPath} fill="none" stroke="#999" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
      <motion.path
        d={forecastPath}
        fill="none"
        stroke={data.capacity_warning ? "#B0201F" : "#111"}
        strokeWidth="2"
        strokeDasharray="4 3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
      />
      {data.forecast.map((p, i) => (
        <motion.circle
          key={i}
          cx={pointX(historyLen + i)}
          cy={pointY(p.value)}
          r="3"
          fill={data.capacity_warning ? "#B0201F" : "#111"}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8 + i * 0.1, type: "spring" }}
        />
      ))}
      {all.map((p, i) =>
        i % 2 === 0 ? (
          <text key={i} x={pointX(i)} y={h - 6} fontSize="8" fill="#aaa" textAnchor="middle">
            {p.label}
          </text>
        ) : null
      )}
    </svg>
  );
}

export default function Analytics({ hospitalId }: { hospitalId: string }) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([api.analyticsSummary(hospitalId), api.analyticsForecast(6, hospitalId)])
      .then(([s, f]) => {
        setSummary(s);
        setForecast(f);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId]);

  if (loading || !summary || !forecast) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: theme.faint, fontFamily: theme.sans, fontSize: 13 }}>
        Loading analytics…
      </div>
    );
  }

  return (
    <div>
      <Reveal>
        <h3 style={{ fontFamily: theme.serif, fontSize: 22, fontWeight: 400, marginBottom: 4, color: theme.ink }}>
          Operational Analytics
        </h3>
        <p style={{ fontSize: 13, color: theme.sub, fontFamily: theme.sans, marginBottom: 20 }}>
          Live KPIs aggregated from the current hospital state, plus a transparent short-horizon capacity forecast.
        </p>
      </Reveal>

      <AnimatePresence>
        {forecast.capacity_warning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              backgroundColor: "#FDE7E7",
              border: "1px solid #F5C2C2",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
              overflow: "hidden",
            }}
          >
            <PulseDot color="#B0201F" size={8} />
            <span style={{ fontSize: 13, color: "#B0201F", fontFamily: theme.sans, fontWeight: 600 }}>{forecast.capacity_warning_message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <RevealGroup style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }} stagger={0.06} className="analytics-kpi-grid">
        <style>{`@media (max-width: 700px) { .analytics-kpi-grid { grid-template-columns: repeat(2,1fr) !important; } }`}</style>
        {[
          { label: "Total Patients", value: summary.total_patients },
          { label: "Red-Flag Rate", value: Math.round(summary.red_flag_rate * 100), suffix: "%", color: summary.red_flag_rate > 0.3 ? "#B0201F" : undefined },
          { label: "Avg Confidence", value: summary.avg_confidence ? Math.round(summary.avg_confidence * 100) : 0, suffix: "%" },
          { label: "Beds Available", value: summary.bed_status_counts.available || 0, color: "#2F7A3C" },
        ].map((k) => (
          <motion.div key={k.label} variants={revealItem} style={{ border: `1px solid ${theme.border}`, borderRadius: 12, padding: "16px 18px", backgroundColor: "#fff" }}>
            <div style={{ fontSize: 10, color: theme.faint, fontFamily: theme.sans, letterSpacing: "0.05em", marginBottom: 6 }}>{k.label.toUpperCase()}</div>
            <div style={{ fontSize: 26, fontFamily: theme.serif, color: k.color || theme.ink }}>
              <CountUp value={k.value} suffix={k.suffix || ""} />
            </div>
          </motion.div>
        ))}
      </RevealGroup>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, marginBottom: 24 }} className="analytics-mid-grid">
        <style>{`@media (max-width: 800px) { .analytics-mid-grid { grid-template-columns: 1fr !important; } }`}</style>
        <Reveal delay={0.1}>
          <div style={{ border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, backgroundColor: "#fff", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.ink, fontFamily: theme.sans, marginBottom: 16, alignSelf: "flex-start" }}>ESI Distribution</div>
            <EsiDonut distribution={summary.esi_distribution} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 16, width: "100%" }}>
              {[1, 2, 3, 4, 5].map((level) => (
                <div key={level} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: theme.sans, color: theme.sub }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: esiColors[level].fg }} />
                  ESI-{level} <span style={{ marginLeft: "auto", fontWeight: 600, color: theme.ink }}>{summary.esi_distribution[String(level)] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div style={{ border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, backgroundColor: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.ink, fontFamily: theme.sans }}>Admission Rate Forecast</div>
              <span style={{ fontSize: 11, color: theme.faint, fontFamily: theme.sans }}>next {forecast.forecast.length}h</span>
            </div>
            <div style={{ fontSize: 11, color: theme.faint, fontFamily: theme.sans, marginBottom: 12 }}>{forecast.method}</div>
            <ForecastChart data={forecast} />
            <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, fontFamily: theme.sans, color: theme.sub }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 14, height: 2, backgroundColor: "#999", display: "inline-block" }} /> Observed</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 14, height: 2, backgroundColor: forecast.capacity_warning ? "#B0201F" : "#111", display: "inline-block" }} /> Forecast</div>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.15}>
        <div style={{ border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, backgroundColor: "#fff" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.ink, fontFamily: theme.sans, marginBottom: 16 }}>Ward Utilization</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(summary.ward_utilization).map(([ward, w], i) => {
              const pct = w.total ? Math.round(((w.occupied + w.reserved) / w.total) * 100) : 0;
              const barColor = pct >= 80 ? "#DC2626" : pct >= 60 ? "#EA580C" : "#16A34A";
              return (
                <div key={ward} style={{ display: "grid", gridTemplateColumns: "140px 1fr 50px", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontFamily: theme.sans, color: theme.ink, fontWeight: 500 }}>{ward}</span>
                  <div style={{ height: 8, backgroundColor: "#F0EDE9", borderRadius: 4, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                      style={{ height: "100%", backgroundColor: barColor, borderRadius: 4 }}
                    />
                  </div>
                  <span style={{ fontSize: 11, fontFamily: "monospace", color: theme.sub, textAlign: "right" }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
