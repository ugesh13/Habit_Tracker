import { addDays, format, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';

interface HeatmapCalendarProps {
  /** Map of 'yyyy-MM-dd' -> completion ratio 0..1 */
  data: Record<string, number>;
  weeks?: number; // Kept for API compatibility, but we will show the current month
}

function intensityClass(ratio: number): string {
  if (ratio <= 0) return 'bg-transparent text-ink dark:text-dark-text';
  if (ratio < 0.34) return 'bg-sage/20 text-ink dark:text-dark-text';
  if (ratio < 0.67) return 'bg-sage/50 text-ink dark:text-dark-text';
  if (ratio < 1) return 'bg-sage/80 text-white dark:text-dark-text';
  return 'bg-sage dark:bg-sage-light text-white';
}

export function HeatmapCalendar({ data }: HeatmapCalendarProps) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = startOfWeek(addDays(monthEnd, 6), { weekStartsOn: 0 });

  const days = eachDayOfInterval({
    start: startDate,
    end: addDays(endDate, -1) // End before the next week starts
  });

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl border border-hairline bg-white/40 dark:bg-dark-surface/40 dark:border-dark-hairline shadow-sm backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg text-sage-dark dark:text-sage-light">
          {format(monthStart, 'MMMM yyyy')}
        </h3>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-xs font-medium text-ink/50 dark:text-dark-text/50">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const ratio = data[key] ?? 0;
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isFuture = day > today;
          
          return (
            <div
              key={key}
              title={`${format(day, 'MMM d, yyyy')}: ${Math.round(ratio * 100)}% complete`}
              className={`
                flex items-center justify-center aspect-square rounded-full text-sm transition-all duration-300
                ${!isCurrentMonth ? 'opacity-30' : ''}
                ${isToday(day) ? 'ring-2 ring-sage ring-offset-1 dark:ring-offset-dark-surface font-bold' : ''}
                ${isFuture ? 'bg-transparent' : intensityClass(ratio)}
                hover:scale-110 cursor-pointer
              `}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink/50 dark:text-dark-text/50">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 0.3, 0.6, 1].map((r) => (
            <div key={r} className={`h-4 w-4 rounded-full ${intensityClass(r)} border border-hairline/50 dark:border-dark-hairline/50`} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
