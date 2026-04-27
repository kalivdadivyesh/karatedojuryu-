import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  attendance: Record<string, "present" | "absent">;
  upcoming: Array<{ class_date: string; class_time: string }>;
}

const fmt = (d: Date) => d.toISOString().split("T")[0];

export default function AttendanceCalendar({ attendance, upcoming }: Props) {
  const [view, setView] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const days = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const last = new Date(view.y, view.m + 1, 0);
    const startPad = first.getDay();
    const total = last.getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(new Date(view.y, view.m, d));
    return cells;
  }, [view]);

  const monthLabel = new Date(view.y, view.m, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const move = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => move(-1)} className="p-2 hover:bg-secondary/50 rounded-lg transition">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-display text-xl">{monthLabel}</h3>
        <button onClick={() => move(1)} className="p-2 hover:bg-secondary/50 rounded-lg transition">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2 font-body">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          if (!d) return <div key={i} />;
          const key = fmt(d);
          const status = attendance[key];
          const upcomingClasses = upcoming.filter(c => c.class_date === key);
          const isUpcoming = upcomingClasses.length > 0;
          let cls = "bg-secondary/30 text-muted-foreground";
          if (status === "present") cls = "bg-green-500/80 text-white font-bold";
          else if (status === "absent") cls = "bg-destructive/80 text-white font-bold";
          else if (isUpcoming) cls = "bg-muted-foreground/30 text-foreground font-semibold ring-1 ring-muted-foreground/50";
          return (
            <div
              key={i}
              className={`aspect-square rounded-md flex flex-col items-center justify-center text-sm transition p-1 ${cls}`}
            >
              <div>{d.getDate()}</div>
              {isUpcoming && (
                <div className="text-xs font-body mt-0.5">
                  {upcomingClasses.map(c => (
                    <div key={`${c.class_date}-${c.class_time}`} className="leading-tight">
                      {c.class_time}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-4 text-xs font-body text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500/80" />Present</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-destructive/80" />Absent</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-muted-foreground/30 ring-1 ring-muted-foreground/50" />Upcoming class</div>
      </div>
    </div>
  );
}
