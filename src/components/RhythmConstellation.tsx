import type { CheckIn, Habit } from '@/lib/types/database';

export function RhythmConstellation({ habits, checkIns }: { habits: Habit[]; checkIns: CheckIn[] }) {
  const totals = new Map(habits.map((habit) => [habit.id, checkIns.filter((checkIn) => checkIn.habit_id === habit.id && (checkIn.status === 'complete' || checkIn.status === 'streak_saved')).length]));
  const max = Math.max(1, ...totals.values());

  return (
    <div className="space-y-5">
      <div className="relative min-h-[22rem] overflow-hidden rounded-card border border-hairline bg-[#edf1e9] p-5 dark:border-dark-hairline dark:bg-dark-surface" aria-label="Rhythm constellation">
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#5d8065_1px,transparent_1px)] [background-size:22px_22px]" />
        {habits.length === 0 ? (
          <div className="relative flex min-h-[20rem] items-center justify-center text-center text-sm text-ink/55 dark:text-dark-text/55">Complete a habit and your rhythm will begin to take shape here.</div>
        ) : habits.map((habit, index) => {
          const angle = (index / Math.max(1, habits.length)) * Math.PI * 2;
          const radius = 28 + (index % 3) * 8;
          const left = 50 + Math.cos(angle) * radius;
          const top = 50 + Math.sin(angle) * radius;
          const consistency = totals.get(habit.id) ?? 0;
          const size = 2.5 + (consistency / max) * 2;
          return (
            <div key={habit.id} className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${left}%`, top: `${top}%` }}>
              <div className="mx-auto rounded-full border-4 border-white/70 shadow-lg dark:border-dark-bg/70" style={{ width: `${size}rem`, height: `${size}rem`, backgroundColor: habit.color }} aria-hidden="true" />
              <p className="mt-2 max-w-28 text-xs font-medium text-ink dark:text-dark-text">{habit.title}</p>
              <p className="text-[11px] text-ink/50 dark:text-dark-text/50">{consistency} check-ins</p>
            </div>
          );
        })}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2" aria-label="Constellation habits">
        {habits.map((habit) => <li key={habit.id} className="rounded-card border border-hairline p-3 text-sm dark:border-dark-hairline"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: habit.color }} />{habit.title}</li>)}
      </ul>
    </div>
  );
}
