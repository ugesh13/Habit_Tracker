'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

function getAuthErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes('email not confirmed')) {
    return 'Your email is not confirmed yet. Open the confirmation email from Supabase, then try signing in again.';
  }
  if (normalized.includes('unsupported provider') || normalized.includes('provider is not enabled')) {
    return 'Google sign-in is not enabled for this app yet. Enable Google under Supabase → Authentication → Providers → Google.';
  }
  if (normalized.includes('rate limit exceeded') || normalized.includes('failed to send confirmation email')) {
    return 'Supabase has temporarily limited confirmation emails. Wait and try again later, or disable Confirm email under Supabase → Authentication → Providers → Email for local testing.';
  }
  return message;
}

export function AuthForm({ mode }: AuthFormProps) {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setConfirmationSent(false);
    setLoading(true);

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(getAuthErrorMessage(error.message));
        return;
      }
      if (!data.session) {
        setConfirmationSent(true);
        return;
      }
      router.push('/today');
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(getAuthErrorMessage(error.message));
      return;
    }
    router.push('/today');
    router.refresh();
  }

  async function handleGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(getAuthErrorMessage(error.message));
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="focus-ring w-full rounded-card border border-hairline bg-transparent px-4 py-2.5 dark:border-dark-hairline"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="focus-ring w-full rounded-card border border-hairline bg-transparent px-4 py-2.5 dark:border-dark-hairline"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-clay">
            {error}
          </p>
        )}

        {confirmationSent && (
          <p role="status" className="text-sm text-sage-dark dark:text-sage-light">
            Account created. Check your email and confirm your address before signing in.
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="focus-ring w-full rounded-card bg-sage px-6 py-3 font-medium text-paper transition-colors hover:bg-sage-dark disabled:opacity-60"
        >
          {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-ink/40 dark:text-dark-text/40">
        <div className="h-px flex-1 bg-hairline dark:bg-dark-hairline" />
        or
        <div className="h-px flex-1 bg-hairline dark:bg-dark-hairline" />
      </div>

      <button
        onClick={handleGoogle}
        type="button"
        className="focus-ring w-full rounded-card border border-hairline px-6 py-3 font-medium transition-colors hover:bg-ink/[0.03] dark:border-dark-hairline dark:hover:bg-white/[0.03]"
      >
        Continue with Google
      </button>
    </div>
  );
}
