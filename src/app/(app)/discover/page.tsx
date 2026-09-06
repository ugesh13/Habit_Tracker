export default function DiscoverPage() {
  const SUGGESTED_HABITS = [
    { title: 'Morning Sunlight', duration: '10 mins', desc: 'Get outside within 30 mins of waking to set your circadian rhythm.' },
    { title: 'Zone 2 Cardio', duration: '45 mins', desc: 'Light steady-state cardio to build your aerobic base.' },
    { title: 'Digital Sunset', duration: '1 hour', desc: 'No screens an hour before bed to improve sleep quality.' },
    { title: 'Gratitude Journal', duration: '5 mins', desc: 'Write down 3 things you are grateful for each evening.' }
  ];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sage dark:text-sage-light">Explore</p>
        <h1 className="font-display mt-2 text-4xl">Discover New Habits</h1>
        <p className="mt-2 text-sm text-ink/60 dark:text-dark-text/60">Find inspiration and learn the science behind building a lasting rhythm.</p>
      </header>

      <section>
        <h2 className="font-display text-2xl mb-4">Masterclass in Habit Building</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Using Huberman & James Clear videos as placeholders */}
          <div className="rounded-card overflow-hidden shadow-sm border border-hairline dark:border-dark-hairline bg-white/50 dark:bg-dark-surface/50">
            <iframe 
              width="100%" 
              height="250" 
              src="https://www.youtube.com/embed/PZ7lDrwYdZc" 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen>
            </iframe>
            <div className="p-4">
              <h3 className="font-medium">The Science of Making & Breaking Habits</h3>
              <p className="text-xs text-ink/60 dark:text-dark-text/60 mt-1">Andrew Huberman</p>
            </div>
          </div>
          <div className="rounded-card overflow-hidden shadow-sm border border-hairline dark:border-dark-hairline bg-white/50 dark:bg-dark-surface/50">
            <iframe 
              width="100%" 
              height="250" 
              src="https://www.youtube.com/embed/U_nzqnXWvSo" 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen>
            </iframe>
            <div className="p-4">
              <h3 className="font-medium">Atomic Habits Summary</h3>
              <p className="text-xs text-ink/60 dark:text-dark-text/60 mt-1">James Clear</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-6">
        <h2 className="font-display text-2xl mb-4">Curated Suggestions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {SUGGESTED_HABITS.map((habit, i) => (
            <div key={i} className="flex justify-between items-center rounded-card border border-hairline p-5 bg-white/70 dark:bg-dark-surface/70 dark:border-dark-hairline shadow-sm hover:shadow-md transition-shadow">
              <div>
                <h3 className="font-medium">{habit.title}</h3>
                <p className="text-xs text-sage mt-0.5">{habit.duration}</p>
                <p className="text-sm text-ink/70 dark:text-dark-text/70 mt-2">{habit.desc}</p>
              </div>
              <a href="/habits/new" className="focus-ring ml-4 shrink-0 rounded-full bg-sage/10 p-3 text-sage hover:bg-sage/20 dark:text-sage-light transition-colors" title="Add to dashboard">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M12 4v16m8-8H4" strokeLinecap="round" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-6">
        <div className="rounded-2xl bg-sage/5 border border-sage/20 p-6 backdrop-blur">
          <h2 className="font-display text-xl mb-3 text-sage-dark dark:text-sage-light">Consistency Tips</h2>
          <ul className="space-y-3 text-sm text-ink/80 dark:text-dark-text/80 list-disc list-inside">
            <li><strong>The 2-Minute Rule:</strong> Downscale your habits until they can be done in two minutes or less.</li>
            <li><strong>Habit Stacking:</strong> Tie your new habit to an existing one (e.g., &quot;After I pour my coffee, I will meditate for 1 minute&quot;).</li>
            <li><strong>Never Miss Twice:</strong> If you miss a day, try to get back on track as quickly as possible.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
