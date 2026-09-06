import { addDays, format, startOfWeek, subWeeks } from 'date-fns';

interface HeatmapCalendarProps {
  /** Map of 'yyyy-MM-dd' -> completion ratio 0..1 */
  data: Record<string, number>;
  weeks?: number;
}

function intensityClass(ratio: number): string {
  if (ratio <= 0) return 'bg-hairline dark:bg-dark-hairline';
  if (ratio < 0.34) return 'bg-sage/30';
  if (ratio < 0.67) return 'bg-sage/60';
  if (ratio < 1) return 'bg-sage/85';
  return 'bg-sage dark:bg-sage-light';
}

export function HeatmapCalendar({ data, weeks = 20 }: HeatmapCalendarProps) {
  const today = new Date();
  const start = startOfWeek(subWeeks(today, weeks - 1), { weekStartsOn: 0 });

  const columns = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d))
  );

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1" role="img" aria-label="Calendar heatmap of habit completion over recent weeks">
        {columns.map((col, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {col.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const ratio = data[key] ?? 0;
              const isFuture = day > today;
              return (
                <div
                  key={key}
                  title={`${format(day, 'MMM d, yyyy')}: ${Math.round(ratio * 100)}% complete`}
                  className={`h-3 w-3 rounded-sm ${isFuture ? 'bg-transparent' : intensityClass(ratio)}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-ink/40 dark:text-dark-text/40">
        Less
        {[0, 0.2, 0.5, 0.8, 1].map((r) => (
          <div key={r} className={`h-3 w-3 rounded-sm ${intensityClass(r)}`} />
        ))}
        More
      </div>
    </div>
  );
}
