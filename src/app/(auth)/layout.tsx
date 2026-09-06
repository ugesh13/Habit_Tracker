export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="font-display mb-8 text-center text-3xl">Rhythm</h1>
      {children}
    </main>
  );
}
