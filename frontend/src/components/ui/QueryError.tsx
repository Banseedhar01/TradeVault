import { Button } from './Button';

interface QueryErrorProps {
  title: string;
  error?: Error | null;
  onRetry: () => void;
  hasCachedData?: boolean;
  isRetrying?: boolean;
}

export const QueryError = ({ title, error, onRetry, hasCachedData, isRetrying }: QueryErrorProps) => (
  <div role="alert" style={{ margin: 12, padding: 14, borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
    <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>
      <strong style={{ display: 'block', marginBottom: 4, color: 'var(--red)' }}>{title}</strong>
      {hasCachedData && <span>Showing previously loaded data. </span>}
      <span>{error?.message || 'Please try again.'}</span>
    </div>
    <Button type="button" variant="secondary" size="sm" onClick={onRetry} disabled={isRetrying}>
      {isRetrying ? 'Retrying…' : 'Retry'}
    </Button>
  </div>
);
