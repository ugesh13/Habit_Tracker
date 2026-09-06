interface ProgressRingProps {
  completed: number;
  total: number;
  size?: number;
}

export function ProgressRing({ completed, total, size = 120 }: ProgressRingProps) {
  const pct = total === 0 ? 0 : completed / total;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${completed} of ${total} habits complete today`}>
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className="stroke-hairline dark:stroke-dark-hairline" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="stroke-sage transition-[stroke-dashoffset] duration-500 ease-out dark:stroke-sage-light"
          fill="none"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-3xl">{completed}</span>
        <span className="text-xs text-ink/50 dark:text-dark-text/50">of {total}</span>
      </div>
    </div>
  );
}
