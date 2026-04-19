import { motion } from "framer-motion";
import { BELTS, BELT_COLORS, BELT_LABELS, Belt } from "@/lib/belts";

interface Props {
  current: Belt;
}

export default function BeltProgression({ current }: Props) {
  const currentIdx = BELTS.indexOf(current);

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex items-center gap-2 min-w-max px-2">
        {BELTS.map((belt, i) => {
          const reached = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={belt} className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: isCurrent ? 1.15 : 1,
                  opacity: reached ? 1 : 0.3,
                }}
                transition={{ delay: i * 0.12, type: "spring", stiffness: 200 }}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="w-14 h-14 rounded-full border-2 flex items-center justify-center shadow-lg"
                  style={{
                    backgroundColor: BELT_COLORS[belt],
                    borderColor: isCurrent ? "hsl(var(--primary))" : "hsl(var(--border))",
                    boxShadow: isCurrent
                      ? `0 0 24px ${BELT_COLORS[belt]}, 0 0 12px hsl(var(--primary) / 0.5)`
                      : reached
                      ? `0 0 8px ${BELT_COLORS[belt]}`
                      : "none",
                  }}
                />
                <span
                  className={`text-xs font-body ${
                    isCurrent ? "text-foreground font-bold" : "text-muted-foreground"
                  }`}
                >
                  {BELT_LABELS[belt]}
                </span>
              </motion.div>
              {i < BELTS.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: i < currentIdx ? 1 : 0.2 }}
                  transition={{ delay: i * 0.12 + 0.05, duration: 0.4 }}
                  className="h-1 w-6 rounded-full origin-left"
                  style={{
                    backgroundColor: i < currentIdx ? "hsl(var(--primary))" : "hsl(var(--border))",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
