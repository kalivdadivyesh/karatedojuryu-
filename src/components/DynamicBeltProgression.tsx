import { motion } from "framer-motion";
import { BeltRow } from "@/lib/beltsApi";

interface Props {
  belts: BeltRow[];
  currentBeltId: string | null;
}

export default function DynamicBeltProgression({ belts, currentBeltId }: Props) {
  const active = belts.filter((b) => b.is_active);
  const currentIdx = active.findIndex((b) => b.id === currentBeltId);

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex items-center gap-2 min-w-max px-2">
        {active.map((belt, i) => {
          const reached = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={belt.id} className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: isCurrent ? 1.18 : 1,
                  opacity: reached ? 1 : 0.35,
                }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 200 }}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="w-12 h-12 rounded-full border-2 shadow-md"
                  style={{
                    backgroundColor: belt.color,
                    borderColor: isCurrent ? belt.color : "rgba(0,0,0,0.1)",
                    boxShadow: isCurrent
                      ? `0 0 20px ${belt.color}, 0 0 8px ${belt.color}80`
                      : reached
                      ? `0 0 6px ${belt.color}80`
                      : "none",
                  }}
                />
                <span
                  className={`text-[11px] font-body whitespace-nowrap ${
                    isCurrent ? "text-foreground font-bold" : "text-muted-foreground"
                  }`}
                >
                  {belt.name}
                </span>
              </motion.div>
              {i < active.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: i < currentIdx ? 1 : 0.25 }}
                  transition={{ delay: i * 0.08 + 0.05, duration: 0.4 }}
                  className="h-1 w-6 rounded-full origin-left"
                  style={{
                    backgroundColor:
                      i < currentIdx ? belt.color : "hsl(var(--border))",
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
