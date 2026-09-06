'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker for offline shell caching and, if the user grants
 * permission, subscribes to push notifications (see /public/sw.js and the
 * push_subscriptions table). Mount this once near the root of the authenticated app.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration can fail in dev over HTTP or unsupported browsers - fail silently,
      // the app works fully online without it.
    });
  }, []);

  return null;
}

/** Call from a user gesture (e.g. a "Turn on reminders" button in Settings). */
export async function requestPushPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';
  const permission = await Notification.requestPermission();
  return permission === 'granted' ? 'granted' : 'denied';
}
