interface ProgressBarProps {
  value: number;
  max: number;
  variant?: 'profit' | 'loss' | 'warning';
  label?: string;
  showPercentage?: boolean;
}

const FILL: Record<string, string> = {
  profit:  'linear-gradient(90deg,#059669,#10b981)',
  loss:    'linear-gradient(90deg,#dc2626,#ef4444)',
  warning: 'linear-gradient(90deg,#d97706,#f59e0b)',
};

const TEXT: Record<string, string> = {
  profit: '#10b981', loss: '#ef4444', warning: '#f59e0b',
};

export const ProgressBar = ({
  value, max, variant = 'profit', label, showPercentage = true,
}: ProgressBarProps) => {
  const pct = Math.min(Math.max((Math.abs(value) / max) * 100, 0), 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="label">{label}</span>
          {showPercentage && (
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: TEXT[variant] }}>
              ${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              <span style={{ opacity: 0.55, fontWeight: 500, color: 'var(--text-2)' }}>
                {' / '}${max.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span style={{ opacity: 0.6, fontWeight: 500, marginLeft: 5 }}>
                ({pct.toFixed(1)}%)
              </span>
            </span>
          )}
        </div>
      )}
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: FILL[variant] }}
        />
      </div>
    </div>
  );
};
