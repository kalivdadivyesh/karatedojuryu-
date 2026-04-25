import { motion } from "framer-motion";
import { BeltRow } from "@/lib/beltsApi";

interface Props {
  belt: BeltRow | null;
  percent: number;
  xpInBelt: number;
  xpRequired: number;
  isMax: boolean;
  size?: number;
}

export default function BeltProgressRing({
  belt,
  percent,
  xpInBelt,
  xpRequired,
  isMax,
  size = 220,
}: Props) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  const color = belt?.color ?? "#94a3b8";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
            fill="none"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              filter: `drop-shadow(0 0 10px ${color}aa)`,
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-24 h-24 rounded-full border-4 flex items-center justify-center shadow-lg"
            style={{
              backgroundColor: color,
              borderColor: "rgba(255,255,255,0.6)",
              boxShadow: `0 0 24px ${color}88`,
            }}
          />
          <div className="absolute bottom-3 text-center">
            <div className="text-xs uppercase tracking-widest text-black font-body">
              {belt?.name ?? "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <div className="font-display text-2xl font-bold text-black">
          {belt?.name ?? "No belt"} – {percent}%
        </div>
        <div className="text-sm text-muted-foreground font-body mt-1">
          {isMax ? "Highest belt achieved" : `${xpInBelt} / ${xpRequired} XP`}
        </div>
      </div>
    </div>
  );
}
