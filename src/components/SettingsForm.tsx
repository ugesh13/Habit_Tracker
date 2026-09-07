'use client';

import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types/database';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

interface SettingsFormProps {
  profile: Profile | null;
  email: string;
}

export function SettingsForm({ profile, email }: SettingsFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [timezone, setTimezone] = useState(profile?.timezone ?? 'UTC');
  const [weekStart, setWeekStart] = useState(profile?.week_start ?? 1);
  const [resetTime, setResetTime] = useState(profile?.daily_reset_time?.slice(0, 5) ?? '04:00');
  const [gamification, setGamification] = useState(profile?.gamification_enabled ?? true);
  const [status, setStatus] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<Record<string, unknown> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState('');

  const inputClass = 'focus-ring w-full rounded-card border border-hairline bg-transparent px-4 py-2.5 dark:border-dark-hairline';

  async function savePrefs() {
    if (!profile) {
      setStatus('Preferences are available after creating an account.');
      return;
    }
    setStatus('Saving…');
    const { error } = await supabase
      .from('profiles')
      .update({ timezone, week_start: weekStart, daily_reset_time: `${resetTime}:00`, gamification_enabled: gamification })
      .eq('id', profile?.id ?? '');
    setStatus(error ? error.message : 'Saved.');
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setStatus('That file is not valid JSON.');
      return;
    }
    setStatus('Importing…');
    const res = await fetch('/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed) });
    const data = await res.json();
    if (!res.ok) {
      setStatus(data.error ?? 'Import failed.');
      return;
    }
    setImportSummary(data.summary);
    setStatus(`Import ${data.status}.`);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function handleDeleteAccount() {
    // Deleting the auth.users row (which cascades to every table via ON DELETE CASCADE)
    // requires the service role, so this calls a server route rather than the browser client.
    await fetch('/api/account', { method: 'DELETE' });
    await supabase.auth.signOut();
    router.push('/');
  }

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = theme === 'dark';
  
  const [notifications, setNotifications] = useState(false);
  const [autosave, setAutosave] = useState(true);
  
  // Profile state
  const [name, setName] = useState(profile?.display_name || 'My Rhythm');
  const [userStatus, setUserStatus] = useState(profile?.user_status || 'Building better habits.');
  const [avatar, setAvatar] = useState(profile?.avatar_url || '🐯');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const AVATAR_PRESETS = ['🐯', '🚀', '🌟', '🦊', '🦉', '🐼', '🦁', '🦋', '🐢', '🦄'];

  function handleManualSave() {
    setStatus('Progress saved for today.');
    setTimeout(() => setStatus(null), 3000);
  }

  async function handleSaveProfile() {
    if (!profile) return;
    setStatus('Saving profile…');
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: name, user_status: userStatus, avatar_url: avatar })
      .eq('id', profile.id);
    
    if (error) {
      setStatus(`Error: ${error.message}`);
    } else {
      setStatus('Profile saved successfully!');
      setIsEditingProfile(false);
      router.refresh();
      setTimeout(() => setStatus(null), 3000);
    }
  }

  async function handleClearData() {
    if (!confirm('WARNING: Are you sure you want to clear ALL your data? This will delete every habit and check-in you have. This cannot be undone.')) return;
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      await supabase.from('check_ins').delete().eq('user_id', userData.user.id);
      await supabase.from('habits').delete().eq('user_id', userData.user.id);
      setStatus('All data cleared.');
    }
  }

  const toggleDarkMode = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <div className="space-y-10">
      {/* Profile Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink/50 dark:text-dark-text/50">Profile</h2>
          {!isEditingProfile && (
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="text-xs flex items-center gap-1 text-sage hover:text-sage-dark dark:text-sage-light transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Profile
            </button>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="shrink-0 flex flex-col items-center gap-2">
            <div className="h-20 w-20 rounded-full bg-sage/20 flex items-center justify-center text-4xl shadow-sm border border-sage/30">
              {avatar.length <= 2 ? avatar : <img src={avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />}
            </div>
          </div>
          
          <div className="space-y-3 flex-1 w-full">
            {isEditingProfile ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-ink/60 dark:text-dark-text/60">Display Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your name" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-ink/60 dark:text-dark-text/60">Status / Mantra</label>
                  <input value={userStatus} onChange={(e) => setUserStatus(e.target.value)} className={inputClass} placeholder="Building better habits." />
                </div>
                
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs text-ink/60 dark:text-dark-text/60">Choose an Avatar</label>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setAvatar(preset)}
                        className={`w-10 h-10 rounded-full text-xl flex items-center justify-center transition-all ${avatar === preset ? 'bg-sage/20 ring-2 ring-sage' : 'bg-ink/5 hover:bg-ink/10 dark:bg-white/5 dark:hover:bg-white/10'}`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={handleSaveProfile} className="focus-ring rounded-card bg-sage px-4 py-2 text-sm font-medium text-paper hover:bg-sage-dark">
                    Save Profile
                  </button>
                  <button onClick={() => setIsEditingProfile(false)} className="focus-ring rounded-card border border-hairline px-4 py-2 text-sm hover:bg-ink/5 dark:border-dark-hairline dark:hover:bg-white/5">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1 py-2">
                <h3 className="font-display text-2xl text-ink dark:text-dark-text">{name}</h3>
                <p className="text-ink/70 dark:text-dark-text/70">{userStatus}</p>
              </div>
            )}
            
            {status && (
              <div className="mt-2 text-sm font-medium text-sage-dark dark:text-sage-light animate-in fade-in">
                {status}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-ink/50 dark:text-dark-text/50">Account</h2>
        <p className="text-sm">{email || 'Guest mode'}</p>
        <div className="flex gap-2">
          <button
            onClick={handleSignOut}
            disabled={!email}
            className="focus-ring rounded-card border border-hairline px-4 py-2 text-sm disabled:opacity-40 dark:border-dark-hairline"
          >
            Sign out
          </button>
          <button
            onClick={handleSignOut}
            disabled={!email}
            className="focus-ring rounded-card border border-hairline px-4 py-2 text-sm disabled:opacity-40 dark:border-dark-hairline bg-sage/10 text-sage-dark dark:text-sage-light"
          >
            Switch Account
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-ink/50 dark:text-dark-text/50">Preferences</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={mounted ? isDark : false} onChange={toggleDarkMode} className="h-4 w-4 rounded text-sage focus:ring-sage" />
          Dark Mode
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} className="h-4 w-4 rounded text-sage focus:ring-sage" />
          Enable Notifications
        </label>
        
        <div className="space-y-1.5 pt-4">
          <label className="text-sm font-medium">Timezone</label>
          <input value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClass} placeholder="e.g. Asia/Kolkata" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Week starts on</label>
          <select value={weekStart} onChange={(e) => setWeekStart(Number(e.target.value))} className={inputClass}>
            <option value={0}>Sunday</option>
            <option value={1}>Monday</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Daily reset time</label>
          <input type="time" value={resetTime} onChange={(e) => setResetTime(e.target.value)} className={inputClass} />
        </div>
        <label className="flex items-center gap-2 text-sm pt-4">
          <input type="checkbox" checked={gamification} onChange={(e) => setGamification(e.target.checked)} className="h-4 w-4 text-sage focus:ring-sage" />
          Enable XP, levels, and achievement badges
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={autosave} onChange={(e) => setAutosave(e.target.checked)} className="h-4 w-4 text-sage focus:ring-sage" />
          Enable Autosave
        </label>
        <div className="flex gap-2">
          <button onClick={savePrefs} disabled={!profile} className="focus-ring rounded-card bg-sage px-4 py-2 text-sm font-medium text-paper hover:bg-sage-dark disabled:opacity-40">
            Save preferences
          </button>
          <button onClick={handleManualSave} className="focus-ring rounded-card border border-sage text-sage px-4 py-2 text-sm font-medium hover:bg-sage/10">
            Save all progress of today
          </button>
        </div>
        {status && <p className="text-sm text-ink/60 dark:text-dark-text/60">{status}</p>}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-ink/50 dark:text-dark-text/50">Your data</h2>
        <div className="flex flex-wrap gap-2">
          <a href="/api/export?format=json" className="focus-ring rounded-card border border-hairline px-4 py-2 text-sm dark:border-dark-hairline">
            Export JSON
          </a>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="focus-ring rounded-card border border-hairline px-4 py-2 text-sm dark:border-dark-hairline"
          >
            Restore Data (Upload JSON)
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImport} className="hidden" />
          <button
            onClick={handleClearData}
            className="focus-ring rounded-card border border-clay/30 text-clay px-4 py-2 text-sm hover:bg-clay/10"
          >
            Clear All Data
          </button>
        </div>
        {importSummary && (
          <pre className="overflow-x-auto rounded-card border border-hairline bg-ink/[0.02] p-3 text-xs dark:border-dark-hairline dark:bg-white/[0.02]">
            {JSON.stringify(importSummary, null, 2)}
          </pre>
        )}
      </section>

      <section className="space-y-3 rounded-card border border-clay/30 p-4">
        <h2 className="text-sm font-medium text-clay">Delete account</h2>
        <p className="text-sm text-ink/60 dark:text-dark-text/60">
          {email ? 'This permanently deletes your account and every habit, check-in, and log. This cannot be undone.' : 'Create an account before using account deletion.'}
        </p>
        <input
          value={confirmDelete}
          onChange={(e) => setConfirmDelete(e.target.value)}
          placeholder='Type "DELETE" to confirm'
          disabled={!email}
          className={inputClass}
        />
        <button
          onClick={handleDeleteAccount}
          disabled={!email || confirmDelete !== 'DELETE'}
          className="focus-ring rounded-card bg-clay px-4 py-2 text-sm font-medium text-paper disabled:opacity-40"
        >
          Delete my account
        </button>
      </section>

      <section className="pt-8 pb-12 border-t border-hairline dark:border-dark-hairline text-center">
        <a href="mailto:support@rhythm.app" className="text-sm text-ink/50 hover:text-sage dark:text-dark-text/50 dark:hover:text-sage-light transition-colors">
          Contact Support
        </a>
      </section>
    </div>
  );
}
