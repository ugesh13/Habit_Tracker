import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-transparent py-16 px-4 md:px-10 max-w-3xl mx-auto">
      <Link href="/" className="inline-block mb-8 text-sm font-medium text-sage hover:underline dark:text-sage-light">
        &larr; Back to Home
      </Link>
      
      <h1 className="font-display text-4xl mb-8 text-sage-dark dark:text-sage-light">Terms of Service</h1>
      
      <div className="space-y-8 text-ink/80 dark:text-dark-text/80 leading-relaxed text-sm md:text-base">
        <p>
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        
        <section>
          <h2 className="text-2xl font-display mb-3 text-ink dark:text-dark-text">1. Agreement to Terms</h2>
          <p>
            By accessing or using Rhythm (&quot;the App&quot;), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display mb-3 text-ink dark:text-dark-text">2. Description of Service</h2>
          <p>
            Rhythm is a personal habit and wellness tracking application. We provide tools to help you track your daily routines, habits, and moods. The service is provided &quot;as is&quot; and we reserve the right to modify, suspend, or discontinue the service at any time without notice.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display mb-3 text-ink dark:text-dark-text">3. User Accounts</h2>
          <p>
            To use certain features of the App, you must register for an account (e.g., via Google Auth). You are responsible for safeguarding the password or credentials that you use to access the service and for any activities or actions under your password. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display mb-3 text-ink dark:text-dark-text">4. Acceptable Use</h2>
          <p>
            You agree not to use the App for any unlawful purpose or in any way that interrupts, damages, or impairs the service. You retain all rights to the data (habits, routines, notes) you enter into the App, and you are solely responsible for its legality, reliability, and appropriateness.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display mb-3 text-ink dark:text-dark-text">5. Intellectual Property</h2>
          <p>
            The original content, features, and functionality of Rhythm are and will remain the exclusive property of its creators. The App is protected by copyright, trademark, and other laws of both the United States and foreign countries.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display mb-3 text-ink dark:text-dark-text">6. Limitation of Liability</h2>
          <p>
            In no event shall Rhythm, nor its developers, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
          </p>
        </section>
        
        <section>
          <h2 className="text-2xl font-display mb-3 text-ink dark:text-dark-text">7. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our App after those revisions become effective, you agree to be bound by the revised terms.
          </p>
        </section>
      </div>
    </div>
  );
}
