export const BELTS = [
  "white",
  "white2",
  "yellow",
  "orange",
  "green",
  "purple",
  "blue",
  "brown3",
  "brown2",
  "brown1",
  "black",
] as const;

export type Belt = (typeof BELTS)[number];

export const BELT_COLORS: Record<Belt, string> = {
  white: "#f8fafc",
  white2: "#e2e8f0",
  yellow: "#facc15",
  orange: "#fb923c",
  green: "#22c55e",
  purple: "#a855f7",
  blue: "#3b82f6",
  brown3: "#a16207",
  brown2: "#854d0e",
  brown1: "#713f12",
  black: "#0a0a0a",
};

export const BELT_LABELS: Record<Belt, string> = {
  white: "White",
  white2: "White II",
  yellow: "Yellow",
  orange: "Orange",
  green: "Green",
  purple: "Purple",
  blue: "Blue",
  brown3: "Brown III",
  brown2: "Brown II",
  brown1: "Brown I",
  black: "Black",
};
