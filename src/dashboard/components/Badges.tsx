import { motion } from "framer-motion";
import { esiColors, bedStatusColors, theme } from "../theme";
import { PulseDot } from "../../shared/motion";

export function ESIBadge({ level }: { level: number | null }) {
  if (level === null) {
    return (
      <span style={{ fontSize: 11, color: theme.faint, fontFamily: theme.sans }}>—</span>
    );
  }
  const c = esiColors[level] || esiColors[5];
  return (
    <motion.span
      initial={{ scale: 0.85, opacity: 0.6 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        backgroundColor: c.bg,
        color: c.fg,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: theme.sans,
        whiteSpace: "nowrap",
      }}
    >
      {level === 1 && <PulseDot color={c.fg} size={6} />}
      {c.label}
    </motion.span>
  );
}

export function BedStatusBadge({ status }: { status: string }) {
  const c = bedStatusColors[status] || bedStatusColors.maintenance;
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px",
        borderRadius: 999,
        backgroundColor: c.bg,
        color: c.fg,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: theme.sans,
        textTransform: "capitalize",
      }}
    >
      <PulseDot color={c.dot} size={6} />
      {status}
    </motion.span>
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.06, backgroundColor: theme.ink, color: "#fff" }}
      style={{
        display: "inline-block",
        padding: "3px 9px",
        borderRadius: 999,
        border: `1px solid ${theme.border}`,
        fontSize: 11,
        color: theme.sub,
        fontFamily: theme.sans,
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      {children}
    </motion.span>
  );
}
