'use client';

import clsx from 'clsx';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/today', label: 'Dashboard', icon: SunIcon },
  { href: '/calendar', label: 'Calendar', icon: CalendarIcon },
  { href: '/routines', label: 'Routines', icon: RoutineIcon },
  { href: '/insights', label: 'Insights', icon: InsightsIcon },
  { href: '/discover', label: 'Discover', icon: CompassIcon },
  { href: '/constellation', label: 'Constellation', icon: ConstellationIcon },
  { href: '/recovery', label: 'Recovery', icon: RecoveryIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        aria-label="Main"
        className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-hairline bg-paper/70 p-5 backdrop-blur dark:border-dark-hairline dark:bg-dark-bg/80 md:flex"
      >
        <span className="font-display px-2 py-3 text-3xl text-sage-dark dark:text-sage-light">Rhythm</span>
        <p className="px-2 text-xs leading-5 text-ink/45 dark:text-dark-text/45">Small steps, held with care.</p>
        <ul className="mt-10 flex flex-col gap-1.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(
                    'focus-ring flex items-center gap-3 rounded-card px-3 py-2.5 text-sm transition-colors',
                    active
                      ? 'bg-sage/10 font-medium text-sage dark:text-sage-light'
                      : 'text-ink/70 hover:bg-ink/[0.04] dark:text-dark-text/70 dark:hover:bg-white/[0.04]'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-hairline bg-paper/95 backdrop-blur dark:border-dark-hairline dark:bg-dark-bg/95 md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'focus-ring flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs',
                active ? 'text-sage dark:text-sage-light' : 'text-ink/50 dark:text-dark-text/50'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </svg>
  );
}
function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}
function RoutineIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M4 6h16M4 12h10M4 18h13" />
    </svg>
  );
}
function InsightsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}
function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13a7.97 7.97 0 000-2l2-1.6-2-3.4-2.4 1a8 8 0 00-1.7-1L15 3h-6l-.3 2.6a8 8 0 00-1.7 1l-2.4-1-2 3.4L4.6 11a7.97 7.97 0 000 2l-2 1.6 2 3.4 2.4-1a8 8 0 001.7 1L9 21h6l.3-2.6a8 8 0 001.7-1l2.4 1 2-3.4-2-1.6z" />
    </svg>
  );
}
function ConstellationIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx="6" cy="8" r="2" /><circle cx="17" cy="5" r="2" /><circle cx="15" cy="17" r="2" /><path d="m7.7 7 7.5-1M7.5 9.4l6 6M16.5 7l-1 8" />
    </svg>
  );
}
function RecoveryIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M4 12a8 8 0 1 0 2.3-5.7M4 5v5h5" />
    </svg>
  );
}

function CompassIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
