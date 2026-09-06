import { AppNav } from '@/components/AppNav';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent">
      <ServiceWorkerRegistration />
      <AppNav />
      <main className="pb-20 md:ml-56 md:pb-0">
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-10 md:py-10">{children}</div>
      </main>
    </div>
  );
}
