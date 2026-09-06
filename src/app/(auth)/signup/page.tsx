import { AuthForm } from '@/components/AuthForm';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <AuthForm mode="signup" />
      <p className="text-center text-sm text-ink/60 dark:text-dark-text/60">
        Already have an account?{' '}
        <Link href="/login" className="underline decoration-hairline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
