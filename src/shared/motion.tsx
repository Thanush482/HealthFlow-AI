import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import type { Variants } from "framer-motion";
import { useEffect, useRef } from "react";

/** Fades + slides an element in once when it scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  duration = 0.6,
  once = true,
  className,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  once?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

/** Staggers its direct motion children in as a group scrolls into view. */
export function RevealGroup({
  children,
  stagger = 0.08,
  className,
  style,
}: {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] } },
};

export const MotionDiv = motion.div;

/** A card wrapper with a consistent hover lift + shadow used across both surfaces. */
export function HoverCard({
  children,
  className,
  style,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <motion.div
      className={className}
      style={{ cursor: onClick ? "pointer" : undefined, ...style }}
      onClick={onClick}
      whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(17,17,17,0.10)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Animates a number counting up from 0 to `value` once it's in view. */
export function CountUp({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (latest) => latest.toFixed(decimals));

  useEffect(() => {
    if (inView) {
      const controls = animate(mv, value, { duration: 1.4, ease: [0.21, 0.47, 0.32, 0.98] });
      return controls.stop;
    }
  }, [inView, value, mv]);

  return (
    <span ref={ref}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

/** Soft floating animated gradient blob used as ambient background decoration. */
export function GradientBlob({
  color = "#111111",
  size = 480,
  top,
  left,
  right,
  bottom,
  opacity = 0.06,
  duration = 10,
}: {
  color?: string;
  size?: number;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  opacity?: number;
  duration?: number;
}) {
  return (
    <motion.div
      aria-hidden
      style={{
        position: "absolute",
        top,
        left,
        right,
        bottom,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        opacity,
        filter: "blur(80px)",
        pointerEvents: "none",
        zIndex: 0,
      }}
      animate={{
        scale: [1, 1.15, 1],
        x: [0, 20, 0],
        y: [0, -20, 0],
      }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/** Continuous slow pulse used to draw attention to "live" indicators. */
export function PulseDot({ color = "#3FA556", size = 8 }: { color?: string; size?: number }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size }}>
      <motion.span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 999,
          backgroundColor: color,
        }}
        animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
      />
      <span style={{ width: size, height: size, borderRadius: 999, backgroundColor: color, position: "relative" }} />
    </span>
  );
}
