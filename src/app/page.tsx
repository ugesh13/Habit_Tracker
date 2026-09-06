import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 px-6 text-center relative z-10">
      <div className="space-y-3">
        <h1 className="font-display text-5xl">Rhythm</h1>
        <p className="text-ink/70 dark:text-dark-text/70">
          A calm place to keep your habits, routines, and reflections — yours alone.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <Link
          href="/signup"
          className="focus-ring rounded-card bg-sage px-6 py-3 text-center font-medium text-paper transition-colors hover:bg-sage-dark"
        >
          Create an account
        </Link>
        <Link
          href="/login"
          className="focus-ring rounded-card border border-hairline px-6 py-3 text-center font-medium transition-colors hover:bg-ink/[0.03] dark:border-dark-hairline dark:hover:bg-white/[0.03]"
        >
          Sign in with email
        </Link>
        <Link
          href="/today?guest=1"
          className="focus-ring rounded-card px-6 py-3 text-center text-sm text-ink/60 underline decoration-hairline underline-offset-4 dark:text-dark-text/60"
        >
          Continue without signing in
        </Link>
      </div>
    </main>
  );
}
