import { AuthForm } from '@/components/AuthForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <AuthForm mode="login" />
      <p className="text-center text-sm text-ink/60 dark:text-dark-text/60">
        New to Rhythm?{' '}
        <Link href="/signup" className="underline decoration-hairline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}
