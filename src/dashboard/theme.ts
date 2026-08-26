export const theme = {
  bg: "#F7F5F2",
  panel: "#FFFFFF",
  border: "#E0DAD3",
  ink: "#111111",
  sub: "#666666",
  faint: "#999999",
  dark: "#111111",
  accent: "#111111",
  serif: "'DM Serif Display', serif",
  sans: "'DM Sans', sans-serif",
};

export const esiColors: Record<number, { bg: string; fg: string; label: string }> = {
  1: { bg: "#FDE7E7", fg: "#B0201F", label: "ESI-1 Resuscitation" },
  2: { bg: "#FDEFE2", fg: "#B4600A", label: "ESI-2 Emergent" },
  3: { bg: "#FDF6DC", fg: "#8A6D00", label: "ESI-3 Urgent" },
  4: { bg: "#E9F3E7", fg: "#2F7A3C", label: "ESI-4 Less Urgent" },
  5: { bg: "#E9F0FB", fg: "#295DA8", label: "ESI-5 Non-Urgent" },
};

export const bedStatusColors: Record<string, { bg: string; fg: string; dot: string }> = {
  available: { bg: "#E9F3E7", fg: "#2F7A3C", dot: "#3FA556" },
  occupied: { bg: "#E9F0FB", fg: "#295DA8", dot: "#3B6FC4" },
  reserved: { bg: "#F3E8FD", fg: "#7C3AED", dot: "#A855F7" },
  cleaning: { bg: "#FDF6DC", fg: "#8A6D00", dot: "#D9A916" },
  maintenance: { bg: "#F1F1F1", fg: "#555555", dot: "#888888" },
};

export const roleColors: Record<string, { bg: string; fg: string }> = {
  doctor: { bg: "#E9F0FB", fg: "#295DA8" },
  nurse: { bg: "#E9F3E7", fg: "#2F7A3C" },
  admin: { bg: "#F3E8FD", fg: "#7C3AED" },
  ambulance: { bg: "#FDE7E7", fg: "#B0201F" },
  patient: { bg: "#FDF6DC", fg: "#8A6D00" },
};
