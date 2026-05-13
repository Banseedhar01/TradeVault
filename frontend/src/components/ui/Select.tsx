import { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = ({ label, error, options, style, ...props }: SelectProps) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{
          fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)',
          textTransform: 'uppercase', letterSpacing: '0.07em',
        }}>
          {label}
        </label>
      )}
      <select
        style={{
          width: '100%', padding: '8px 10px', boxSizing: 'border-box',
          background: 'var(--inset)', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 6, color: 'var(--text-1)', fontSize: '0.8125rem',
          outline: 'none', cursor: 'pointer',
          ...style,
        }}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} style={{ background: 'var(--surface)' }}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span style={{ fontSize: '0.7rem', color: 'var(--red)' }}>{error}</span>
      )}
    </div>
  );
};
