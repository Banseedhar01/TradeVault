import { ReactNode, CSSProperties } from 'react';

interface BadgeProps {
  variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral';
  children: ReactNode;
  className?: string;
}

const STYLES: Record<string, CSSProperties> = {
  success: { background: 'rgba(16,185,129,0.1)',  color: '#10b981', border: '1px solid rgba(16,185,129,0.22)' },
  error:   { background: 'rgba(239,68,68,0.1)',   color: '#ef4444', border: '1px solid rgba(239,68,68,0.22)' },
  warning: { background: 'rgba(245,158,11,0.1)',  color: '#f59e0b', border: '1px solid rgba(245,158,11,0.22)' },
  info:    { background: 'rgba(96,165,250,0.1)',  color: '#60a5fa', border: '1px solid rgba(96,165,250,0.22)' },
  neutral: { background: 'rgba(255,255,255,0.05)', color: '#71717a', border: '1px solid rgba(255,255,255,0.09)' },
};

export const Badge = ({ variant = 'neutral', children, className = '' }: BadgeProps) => (
  <span className={`badge ${className}`} style={STYLES[variant]}>
    {children}
  </span>
);
