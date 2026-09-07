let audioCtx: AudioContext | null = null;

function getContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playHappySound() {
  const ctx = getContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  
  // A major chord arpeggio (C E G) to sound happy and motivational
  const notes = [
    { freq: 523.25, time: 0 },    // C5
    { freq: 659.25, time: 0.1 },  // E5
    { freq: 783.99, time: 0.2 },  // G5
    { freq: 1046.50, time: 0.3 }  // C6
  ];

  notes.forEach(({ freq, time }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t + time);

    gain.gain.setValueAtTime(0, t + time);
    gain.gain.linearRampToValueAtTime(0.1, t + time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + time + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t + time);
    osc.stop(t + time + 0.4);
  });
}

export function playSadSound() {
  const ctx = getContext();
  if (!ctx) return;

  const t = ctx.currentTime;
  
  // A descending minor/dissonant sequence to sound unmotivated/sad
  const notes = [
    { freq: 440.00, time: 0 },    // A4
    { freq: 415.30, time: 0.2 },  // Ab4
    { freq: 392.00, time: 0.4 },  // G4
  ];

  notes.forEach(({ freq, time }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Triangle wave sounds a bit more hollow/dull
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t + time);
    // Slight pitch bend down
    osc.frequency.exponentialRampToValueAtTime(freq - 20, t + time + 0.3);

    gain.gain.setValueAtTime(0, t + time);
    gain.gain.linearRampToValueAtTime(0.1, t + time + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + time + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t + time);
    osc.stop(t + time + 0.6);
  });
}
