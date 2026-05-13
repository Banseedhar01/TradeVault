import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({ label, error, style, ...props }: InputProps) => {
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
      <input
        style={{
          width: '100%', padding: '8px 10px', boxSizing: 'border-box',
          background: 'var(--inset)', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
          borderRadius: 6, color: 'var(--text-1)', fontSize: '0.8125rem', outline: 'none',
          colorScheme: 'dark',
          ...style,
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '0.7rem', color: 'var(--red)' }}>{error}</span>
      )}
    </div>
  );
};
