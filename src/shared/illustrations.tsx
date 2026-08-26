import { motion } from "framer-motion";

/** Animated ECG / vitals waveform line — used in the Hero and CTA. */
export function VitalsWave({ width = 520, height = 120, stroke = "#111111" }: { width?: number; height?: number; stroke?: string }) {
  const path =
    "M0,60 L60,60 L80,60 L95,20 L115,100 L135,10 L150,60 L200,60 L220,60 L235,30 L250,90 L265,60 L520,60";
  return (
    <svg width={width} height={height} viewBox="0 0 520 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.path
        d={path}
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity, repeatType: "loop", repeatDelay: 0.6 }}
      />
    </svg>
  );
}

/** Concentric radar-style rings representing live triage scanning / detection. */
export function RadarPulse({ size = 220, color = "#111111" }: { size?: number; color?: string }) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `1px solid ${color}`,
          }}
          animate={{ scale: [0.3, 1.4], opacity: [0.5, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: "easeOut" }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 14,
          height: 14,
          borderRadius: "50%",
          backgroundColor: color,
        }}
      />
    </div>
  );
}

/** Abstract animated bed-grid illustration: a matrix of tiles that light up in sequence, representing live capacity allocation. */
export function BedGridIllustration({ cols = 8, rows = 4, tile = 20, gap = 6 }: { cols?: number; rows?: number; tile?: number; gap?: number }) {
  const tiles = Array.from({ length: cols * rows }, (_, i) => i);
  const width = cols * tile + (cols - 1) * gap;
  const height = rows * tile + (rows - 1) * gap;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${tile}px)`, gap, width, height }}>
      {tiles.map((i) => (
        <motion.div
          key={i}
          style={{ width: tile, height: tile, borderRadius: 4, backgroundColor: "#111111" }}
          initial={{ opacity: 0.08 }}
          animate={{ opacity: [0.08, 0.35, 0.08] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: (i % cols) * 0.12 + Math.floor(i / cols) * 0.08,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/** Animated node-graph illustration representing the ontology/RAG grounding layer. */
export function NetworkGraph({ size = 260, color = "#111111" }: { size?: number; color?: string }) {
  const nodes = [
    { x: 130, y: 30 },
    { x: 40, y: 90 },
    { x: 220, y: 90 },
    { x: 80, y: 170 },
    { x: 180, y: 170 },
    { x: 130, y: 230 },
  ];
  const edges = [
    [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5], [1, 2],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 260 260" fill="none">
      {edges.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          stroke={color}
          strokeWidth={1}
          strokeOpacity={0.25}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: i * 0.08 }}
        />
      ))}
      {nodes.map((n, i) => (
        <motion.circle
          key={i}
          cx={n.x}
          cy={n.y}
          r={i === nodes.length - 1 ? 8 : 6}
          fill={color}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.4 + i * 0.1, type: "spring" }}
        />
      ))}
    </svg>
  );
}

/** Rotating dashed ring used as a decorative accent behind stat numbers/icons. */
export function SpinRing({ size = 160, color = "#111111" }: { size?: number; color?: string }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      style={{ position: "absolute", top: "50%", left: "50%", translateX: "-50%", translateY: "-50%" }}
      animate={{ rotate: 360 }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
    >
      <circle cx="80" cy="80" r="76" stroke={color} strokeOpacity={0.15} strokeWidth={1.5} strokeDasharray="4 8" fill="none" />
    </motion.svg>
  );
}

/** A soft animated "scanning" gradient sweep, used behind hero copy or CTA. */
export function ScanSweep({ width = 600, height = 260 }: { width?: number; height?: number }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 24, pointerEvents: "none" }}>
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: 140,
          background: "linear-gradient(90deg, transparent, rgba(17,17,17,0.06), transparent)",
        }}
        animate={{ left: [-160, width] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
      />
    </div>
  );
}

/** Small animated heartbeat/plus icon badge used as a recurring motif. */
export function PulseBadge({ size = 44, bg = "#111111", fg = "#fff" }: { size?: number; bg?: string; fg?: string }) {
  return (
    <motion.div
      style={{
        width: size,
        height: size,
        borderRadius: size / 3,
        backgroundColor: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
      whileHover={{ rotate: 8, scale: 1.06 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <motion.path
          d="M2 12h4l2-7 4 14 3-9 2 4h5"
          stroke={fg}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        />
      </svg>
    </motion.div>
  );
}
