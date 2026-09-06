'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const SUGGESTED_HABITS = [
  { id: 'h1', title: 'Read 10 pages', icon: '📖' },
  { id: 'h2', title: 'Drink 2L Water', icon: '💧' },
  { id: 'h3', title: 'Meditate 5 mins', icon: '🧘' },
  { id: 'h4', title: 'Stretch', icon: '🏃' },
];

export default function OnboardingPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  // removed unused timeOfDay and mainGoal state hooks for linting
  const [saving, setSaving] = useState(false);

  const toggleHabit = (id: string) => {
    setSelectedHabits(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]);
  };

  async function finish() {
    setSaving(true);
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      // Save profile context (timezone is required for date logic)
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await supabase
        .from('profiles')
        .update({ week_start: 1, gamification_enabled: true, timezone })
        .eq('id', data.user.id);
      
      // Map selected habits to the database
      const habitsToInsert = selectedHabits.map(id => {
        const h = SUGGESTED_HABITS.find(s => s.id === id);
        return {
          user_id: data.user!.id,
          title: h?.title || 'New Habit',
          icon: h?.icon || '⭐',
          color: '#5d8065', // default sage
          start_date: new Date().toISOString().split('T')[0],
        };
      });

      if (habitsToInsert.length > 0) {
        await supabase.from('habits').insert(habitsToInsert);
      }
    }
    router.push('/today');
  }

  return (
    <div className="mx-auto max-w-md space-y-8 py-12 relative z-10 bg-paper/90 dark:bg-dark-bg/90 p-8 rounded-card shadow-lg backdrop-blur-sm">
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h1 className="font-display text-3xl">Let&apos;s build your rhythm.</h1>
            <p className="mt-2 text-ink/70 dark:text-dark-text/70">What habits would you like to start with? Select all that apply.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {SUGGESTED_HABITS.map(h => (
              <button
                key={h.id}
                onClick={() => toggleHabit(h.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-card border transition-all ${
                  selectedHabits.includes(h.id) 
                    ? 'border-sage bg-sage/10 text-sage dark:text-sage-light shadow-sm' 
                    : 'border-hairline hover:bg-ink/[0.02] dark:border-dark-hairline'
                }`}
              >
                <span className="text-2xl">{h.icon}</span>
                <span className="text-sm font-medium">{h.title}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={selectedHabits.length === 0}
            className="focus-ring w-full rounded-card bg-sage px-6 py-3 font-medium text-paper transition-colors hover:bg-sage-dark disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div>
            <h1 className="font-display text-3xl">When are you most active?</h1>
            <p className="mt-2 text-ink/70 dark:text-dark-text/70">This helps us understand your natural routine.</p>
          </div>
          
          <div className="flex flex-col gap-3">
            {['Morning', 'Afternoon', 'Evening'].map(time => (
              <button
                key={time}
                onClick={() => { setStep(3); }}
                className="focus-ring text-left rounded-card border border-hairline p-4 transition-colors hover:bg-ink/[0.03] dark:border-dark-hairline"
              >
                <span className="font-medium">{time}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div>
            <h1 className="font-display text-3xl">What is your main goal?</h1>
            <p className="mt-2 text-ink/70 dark:text-dark-text/70">We&apos;ll tailor your experience around this.</p>
          </div>
          
          <div className="flex flex-col gap-3">
            {['More Focus', 'Better Health', 'More Calm'].map(goal => (
              <button
                key={goal}
                onClick={() => { setStep(4); }}
                className="focus-ring text-left rounded-card border border-hairline p-4 transition-colors hover:bg-ink/[0.03] dark:border-dark-hairline"
              >
                <span className="font-medium">{goal}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sage/20 text-sage">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div>
            <h1 className="font-display text-4xl">You&apos;re all set.</h1>
            <p className="mt-6 italic text-ink/70 dark:text-dark-text/70 font-serif text-lg">
              &quot;Excellence is not an act, but a habit.&quot;
            </p>
          </div>
          
          <button
            onClick={finish}
            disabled={saving}
            className="focus-ring w-full rounded-card bg-sage px-6 py-4 font-medium text-paper transition-colors hover:bg-sage-dark disabled:opacity-50 text-lg"
          >
            {saving ? 'Preparing Dashboard...' : 'Continue to Dashboard'}
          </button>
        </div>
      )}
    </div>
  );
}
