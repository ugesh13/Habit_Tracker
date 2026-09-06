'use client';

import { useEffect, useRef } from 'react';

export function SoundManager() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext on first user interaction
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };

    const playClickSound = () => {
      if (!audioCtxRef.current) return;
      
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      // A beautiful, soft chime/bell sound
      const osc2 = ctx.createOscillator();
      const gainNode2 = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc2.connect(gainNode2);
      gainNode2.connect(ctx.destination);

      // Fundamental frequency
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      // Harmonic frequency for bell-like tone
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1200, ctx.currentTime);
      gainNode2.gain.setValueAtTime(0, ctx.currentTime);
      gainNode2.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.01);
      gainNode2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.5);
    };

    const handleClick = (e: MouseEvent) => {
      initAudio();

      const target = e.target as HTMLElement;
      // Check if the clicked element or any of its parents is a button or link
      const isInteractive = target.closest('button') || target.closest('a') || target.closest('[role="button"]');
      
      if (isInteractive) {
        playClickSound();
      }
    };

    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return null;
}
