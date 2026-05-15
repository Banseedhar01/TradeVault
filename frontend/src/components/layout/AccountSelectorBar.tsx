import { useMemo } from 'react';
import { useAccounts } from '../../hooks/useAccounts';
import { useFirms } from '../../hooks/useFirms';
import { useStore } from '../../store';
import { useIsMobile } from '../../hooks/useIsMobile';
import { deriveAccountStatus, matchesStatusFilter, StatusFilter, AccountStatus } from '../../utils/account';

const STATUS_CFG: Record<AccountStatus, { color: string; label: string; pulse: boolean }> = {
  active:  { color: '#60a5fa', label: 'Active',  pulse: true  },
  live:    { color: '#fbbf24', label: 'Live',    pulse: true  },
  passed:  { color: '#10b981', label: 'Passed',  pulse: false },
  failed:  { color: '#ef4444', label: 'Failed',  pulse: false },
  pending: { color: '#52525b', label: 'Pending', pulse: false },
};

// ── Component ─────────────────────────────────────────────────────────
export const AccountSelectorBar = () => {
  const { data: accounts } = useAccounts();
  const { data: firms }    = useFirms();
  const {
    activeSection,
    viewAccountId,        setViewAccountId,
    accountStatusFilter,  setAccountStatusFilter,
  } = useStore();
  const isMobile = useIsMobile();

  // All accounts in this section — must be before any early return
  const sectionAccounts = useMemo(() => {
    if (!accounts || !firms) return [];
    return accounts.filter(a =>
      firms.find(f => f.id === a.firm_id)?.market_type === activeSection
    );
  }, [accounts, firms, activeSection]);

  // Counts per status bucket for the filter badges
  const counts = useMemo(() => ({
    all:    sectionAccounts.length,
    active: sectionAccounts.filter(a => matchesStatusFilter(a, 'active')).length,
    closed: sectionAccounts.filter(a => matchesStatusFilter(a, 'closed')).length,
  }), [sectionAccounts]);

  // Accounts visible in the individual pill row (filtered by status)
  const visibleAccounts = useMemo(
    () => sectionAccounts.filter(a => matchesStatusFilter(a, accountStatusFilter)),
    [sectionAccounts, accountStatusFilter]
  );

  const firmName = (firmId: string) =>
    firms?.find(f => f.id === firmId)?.name ?? 'Unknown';

  // Early return after all hooks
  if (sectionAccounts.length === 0) return null;

  // ── Status filter tabs config ──────────────────────────────────────
  const STATUS_FILTERS: { key: StatusFilter; label: string; dotColor?: string }[] = [
    { key: 'all',    label: 'All' },
    { key: 'active', label: 'Active', dotColor: '#60a5fa' },
    { key: 'closed', label: 'Closed', dotColor: '#ef4444' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, rowGap: 8, padding: '0 0 16px', flexWrap: 'wrap' }}>

      {/* Label */}
      <span style={{
        fontSize: '0.67rem', fontWeight: 600, color: 'var(--text-4)',
        textTransform: 'uppercase', letterSpacing: '0.09em', flexShrink: 0,
      }}>
        Accounts
      </span>

      {/* ── Status filter group ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2, padding: 3,
        background: 'var(--raised)', border: '1px solid var(--border)',
        borderRadius: 9, flexShrink: 0,
      }}>
        {STATUS_FILTERS.map(({ key, label, dotColor }) => {
          const isActive = accountStatusFilter === key;
          const count    = counts[key];
          return (
            <button
              key={key}
              onClick={() => setAccountStatusFilter(key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 11px', borderRadius: 6, cursor: 'pointer',
                fontSize: '0.72rem', fontWeight: 500, border: 'none',
                background: isActive ? 'var(--surface)' : 'transparent',
                color: isActive ? 'var(--text-1)' : 'var(--text-3)',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                transition: 'all 130ms',
              }}
            >
              {dotColor && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: isActive ? dotColor : 'var(--text-4)',
                  boxShadow: isActive && key === 'active' ? `0 0 5px ${dotColor}` : 'none',
                  transition: 'all 130ms',
                }} />
              )}
              {label}
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, lineHeight: 1,
                padding: '1px 5px', borderRadius: 4,
                background: isActive ? 'rgba(255,255,255,0.08)' : 'var(--inset)',
                color: count === 0 ? 'var(--text-4)' : isActive ? 'var(--text-2)' : 'var(--text-4)',
                border: '1px solid var(--border)',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Separator */}
      {!isMobile && <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />}

      {/* ── Individual account pills ── */}
      {visibleAccounts.length === 0 ? (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-4)', fontStyle: 'italic' }}>
          No {accountStatusFilter === 'closed' ? 'closed' : 'active'} accounts
        </span>
      ) : (
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2,
          scrollbarWidth: 'none', flex: 1,
        }}>

          {/* All pill — scoped to the current status filter */}
          <button
            onClick={() => setViewAccountId(undefined)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '5px 12px', borderRadius: 9, cursor: 'pointer',
              flexShrink: 0, transition: 'all 140ms',
              border: `1px solid ${viewAccountId === undefined ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`,
              background: viewAccountId === undefined ? 'var(--raised)' : 'transparent',
              color: viewAccountId === undefined ? 'var(--text-1)' : 'var(--text-3)',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {accountStatusFilter === 'all'    ? 'All' :
               accountStatusFilter === 'active' ? 'All Active' :
                                                  'All Closed'}
            </span>
            <span style={{
              fontSize: '0.62rem', fontWeight: 600,
              background: viewAccountId === undefined ? 'rgba(255,255,255,0.08)' : 'var(--raised)',
              border: '1px solid var(--border)',
              padding: '1px 5px', borderRadius: 4, color: 'var(--text-3)',
            }}>
              {visibleAccounts.length}
            </span>
          </button>

          {/* Per-account pills */}
          {visibleAccounts.map(account => {
            const status     = deriveAccountStatus(account);
            const cfg        = STATUS_CFG[status];
            const name       = firmName(account.firm_id);
            const stage      = account.stages[account.current_stage];
            const isSelected = viewAccountId === account.id;
            const isClosed   = status === 'failed' || status === 'passed';

            return (
              <button
                key={account.id}
                onClick={() => setViewAccountId(isSelected ? undefined : account.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '5px 12px', borderRadius: 9, cursor: 'pointer',
                  flexShrink: 0, transition: 'all 140ms',
                  border: `1px solid ${isSelected ? cfg.color + '55' : 'var(--border)'}`,
                  background: isSelected ? cfg.color + '12' : 'transparent',
                  color: isSelected ? 'var(--text-1)' : isClosed ? 'var(--text-3)' : 'var(--text-2)',
                  opacity: isClosed && !isSelected ? 0.7 : 1,
                }}
              >
                {/* Status dot */}
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: cfg.color,
                  boxShadow: cfg.pulse && isSelected ? `0 0 7px ${cfg.color}` : 'none',
                  transition: 'box-shadow 140ms',
                }} />

                {/* Firm name + size */}
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1 }}>{name}</span>
                  <span style={{ fontSize: '0.67rem', color: 'var(--text-3)', lineHeight: 1 }}>
                    ${(account.account_size / 1000).toFixed(0)}k
                  </span>
                </span>

                {/* Stage badge */}
                <span style={{
                  fontSize: '0.62rem', fontWeight: 600, padding: '2px 7px', borderRadius: 5,
                  lineHeight: 1,
                  background: isSelected ? cfg.color + '22' : 'var(--raised)',
                  color: isSelected ? cfg.color : 'var(--text-3)',
                  border: `1px solid ${isSelected ? cfg.color + '40' : 'var(--border)'}`,
                  transition: 'all 140ms',
                }}>
                  {status === 'failed' ? 'Failed' : status === 'passed' ? 'Passed' : stage?.name ?? cfg.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Clear filter chip — shown when a specific account is selected */}
      {viewAccountId && (() => {
        const acct = sectionAccounts.find(a => a.id === viewAccountId);
        const cfg  = acct ? STATUS_CFG[deriveAccountStatus(acct)] : STATUS_CFG.pending;
        return (
          <button
            onClick={() => setViewAccountId(undefined)}
            title="Clear account filter"
            style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 9px', borderRadius: 6, cursor: 'pointer',
              background: 'var(--raised)', border: '1px solid var(--border)',
              fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-3)',
              transition: 'all 130ms',
            }}
          >
            <span style={{ color: cfg.color, fontSize: '0.55rem' }}>●</span>
            Filtered
            <span style={{ color: 'var(--text-4)', fontSize: '0.68rem' }}>✕</span>
          </button>
        );
      })()}
    </div>
  );
};
