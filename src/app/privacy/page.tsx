import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-transparent py-16 px-4 md:px-10 max-w-3xl mx-auto">
      <Link href="/" className="inline-block mb-8 text-sm font-medium text-sage hover:underline dark:text-sage-light">
        &larr; Back to Home
      </Link>
      
      <h1 className="font-display text-4xl mb-8 text-sage-dark dark:text-sage-light">Privacy Policy</h1>
      
      <div className="space-y-8 text-ink/80 dark:text-dark-text/80 leading-relaxed text-sm md:text-base">
        <p>
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        
        <section>
          <h2 className="text-2xl font-display mb-3 text-ink dark:text-dark-text">1. Information We Collect</h2>
          <p>
            When you use Rhythm, we collect the minimum amount of information necessary to provide you with our services. 
            If you log in via Google, we receive basic profile information such as your email address and name. We also securely store the data you enter into the app, such as your habits, routines, and daily check-ins.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display mb-3 text-ink dark:text-dark-text">2. How We Use Your Information</h2>
          <p>
            The information we collect is used solely to provide, maintain, and improve the Rhythm app. 
            Your habit data and personal notes remain completely private and are only accessible by you. We do not use your data for targeted advertising, nor do we analyze it for marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display mb-3 text-ink dark:text-dark-text">3. Data Sharing and Disclosure</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. We may share information only when legally required to do so by law enforcement, or to protect our rights or the rights of other users.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display mb-3 text-ink dark:text-dark-text">4. Data Security</h2>
          <p>
            We take reasonable measures to help protect your personal information from loss, theft, misuse, and unauthorized access. 
            Your data is stored securely using industry-standard database providers (like Supabase). However, no internet transmission is completely secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display mb-3 text-ink dark:text-dark-text">5. Your Rights</h2>
          <p>
            You have the right to access, update, or delete your personal information. You can manage your account settings within the app. If you wish to permanently delete your account and all associated data, you can do so through the app&apos;s Settings page or by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-display mb-3 text-ink dark:text-dark-text">6. Contact</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact the developer.
          </p>
        </section>
      </div>
    </div>
  );
}
