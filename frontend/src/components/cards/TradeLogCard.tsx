import { useState, useMemo } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useTrades, useDeleteTrade } from '../../hooks/useTrades';
import { useAccounts } from '../../hooks/useAccounts';
import { useFirms } from '../../hooks/useFirms';
import { Button } from '../ui/Button';
import { TableSkeleton } from '../ui/SkeletonLoader';
import { useStore } from '../../store';
import { Trade } from '../../types/trade';
import { matchesStatusFilter } from '../../utils/account';

const PER_PAGE = 10;

type Filter = 'all' | 'long' | 'short' | 'open' | 'closed';

// ── helpers ──────────────────────────────────────────────────────────
const fmtPrice = (v: number) => v > 100 ? v.toFixed(2) : v.toFixed(5);
const fmtPnL   = (v: number) => `${v >= 0 ? '+' : '-'}$${Math.abs(v).toFixed(2)}`;
const fmtDate  = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const rowAccent = (t: Trade) => {
  if (t.status === 'open')      return '#60a5fa';
  if (t.status === 'cancelled') return '#52525b';
  return t.pnl >= 0 ? '#10b981' : '#ef4444';
};

const calcRR = (t: Trade): string | null => {
  if (!t.stop_loss || !t.take_profit || !t.entry_price) return null;
  const risk   = Math.abs(t.entry_price - t.stop_loss);
  const reward = Math.abs(t.take_profit - t.entry_price);
  if (risk === 0) return null;
  return (reward / risk).toFixed(1) + 'R';
};

// ── Summary stat ─────────────────────────────────────────────────────
const Stat = ({ label, value, color = 'var(--text-1)' }: { label: string; value: string; color?: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span className="label">{label}</span>
    <span style={{ fontSize: '0.9375rem', fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1 }}>
      {value}
    </span>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────
export const TradeLogCard = () => {
  const { data: trades, isLoading, error } = useTrades();
  const { data: accounts } = useAccounts();
  const { data: firms }    = useFirms();
  const { setAddTradeOpen, setEditTradeId, activeSection, viewAccountId, accountStatusFilter } = useStore();
  const deleteTrade = useDeleteTrade();
  const isMobile = useIsMobile();
  const [filter, setFilter]         = useState<Filter>('all');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // IDs of accounts that are in scope: correct section + pass the status filter
  const sectionAccountIds = useMemo(() => {
    if (!accounts || !firms) return null;
    return new Set(
      accounts
        .filter(a => {
          const firm = firms.find(f => f.id === a.firm_id);
          if (firm?.market_type !== activeSection) return false;
          return matchesStatusFilter(a, accountStatusFilter);
        })
        .map(a => a.id)
    );
  }, [accounts, firms, activeSection, accountStatusFilter]);

  // ── Derived data ──────────────────────────────────────────────────
  const summary = useMemo(() => {
    if (!trades) return null;
    // Use the same account/section scope as the table
    let scoped = trades;
    if (viewAccountId) {
      scoped = scoped.filter(t => t.account_id === viewAccountId);
    } else if (sectionAccountIds) {
      scoped = scoped.filter(t => sectionAccountIds.has(t.account_id));
    }
    if (!scoped.length) return null;
    const closed = scoped.filter(t => t.status === 'closed');
    const wins   = closed.filter(t => t.pnl > 0);
    const losses = closed.filter(t => t.pnl <= 0);
    return {
      total:    scoped.length,
      open:     scoped.filter(t => t.status === 'open').length,
      netPnL:   scoped.reduce((s, t) => s + t.pnl, 0),
      winRate:  closed.length ? (wins.length / closed.length) * 100 : 0,
      avgWin:   wins.length   ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0,
      avgLoss:  losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0,
    };
  }, [trades, viewAccountId, sectionAccountIds, accountStatusFilter]);

  const filtered = useMemo(() => {
    if (!trades) return [];
    let list = trades;
    // Scope to the selected account, or all accounts in the current section
    if (viewAccountId) {
      list = list.filter(t => t.account_id === viewAccountId);
    } else if (sectionAccountIds) {
      list = list.filter(t => sectionAccountIds.has(t.account_id));
    }
    if (filter === 'long')   list = list.filter(t => t.direction === 'long');
    if (filter === 'short')  list = list.filter(t => t.direction === 'short');
    if (filter === 'open')   list = list.filter(t => t.status === 'open');
    if (filter === 'closed') list = list.filter(t => t.status === 'closed');
    if (search.trim())       list = list.filter(t => t.instrument.toLowerCase().includes(search.trim().toLowerCase()));
    return list;
  }, [trades, viewAccountId, sectionAccountIds, filter, search]);

  const pages   = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages);
  const visible  = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const resetPage = (fn: () => void) => { fn(); setPage(1); };

  // ── Loading / error states ────────────────────────────────────────
  if (isLoading) return (
    <div className="card">
      <div className="card-header"><span className="card-title">Trade Log</span></div>
      <div className="card-body"><TableSkeleton rows={6} /></div>
    </div>
  );

  if (error) return (
    <div className="card">
      <div className="card-header"><span className="card-title">Trade Log</span></div>
      <div className="card-body" style={{ alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <span style={{ color: 'var(--red)', marginBottom: 12 }}>Failed to load trades</span>
        <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    </div>
  );

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',    label: 'All' },
    { key: 'long',   label: '▲ Long' },
    { key: 'short',  label: '▼ Short' },
    { key: 'open',   label: 'Open' },
    { key: 'closed', label: 'Closed' },
  ];

  return (
    <div className="card">

      {/* ── Header ── */}
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="card-title">Trade Log</span>
          {summary && (
            <span style={{
              fontSize: '0.67rem', fontWeight: 600, color: 'var(--text-3)',
              background: 'var(--raised)', border: '1px solid var(--border)',
              padding: '2px 8px', borderRadius: 5,
            }}>
              {summary.total} trades
            </span>
          )}
          {/* Active scope badge */}
          {(viewAccountId || accountStatusFilter !== 'all') && (() => {
            const label = viewAccountId
              ? accounts?.find(a => a.id === viewAccountId) &&
                firms?.find(f => f.id === accounts!.find(a => a.id === viewAccountId)!.firm_id)?.name
              : accountStatusFilter === 'active' ? 'Active accounts'
              : accountStatusFilter === 'closed' ? 'Closed accounts'
              : null;
            if (!label) return null;
            return (
              <span style={{
                fontSize: '0.62rem', fontWeight: 600, color: 'var(--blue)',
                background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)',
                padding: '2px 8px', borderRadius: 5,
              }}>
                {label}
              </span>
            );
          })()}
        </div>
        <Button variant="primary" size="sm" onClick={() => setAddTradeOpen(true)}>
          + Add Trade
        </Button>
      </div>

      {/* ── Empty state ── */}
      {!trades?.length ? (
        <div className="card-body" style={{ alignItems: 'center', justifyContent: 'center', padding: '56px 20px', gap: 8 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, background: 'var(--raised)',
            border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 4,
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h8" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-2)', fontWeight: 500 }}>No trades yet</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>Click "Add Trade" to record your first trade</span>
        </div>
      ) : (
        <>
          {/* ── Summary strip ── */}
          {summary && (
            <div style={{
              display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)',
              gap: 0, borderBottom: '1px solid var(--border)',
            }}>
              {[
                { label: 'Net PnL',   value: fmtPnL(summary.netPnL),          color: summary.netPnL >= 0 ? 'var(--green)' : 'var(--red)' },
                { label: 'Win Rate',  value: `${summary.winRate.toFixed(1)}%`,  color: summary.winRate >= 50 ? 'var(--green)' : 'var(--red)' },
                { label: 'Avg Win',   value: `+$${summary.avgWin.toFixed(0)}`,  color: 'var(--green)' },
                { label: 'Avg Loss',  value: `-$${Math.abs(summary.avgLoss).toFixed(0)}`, color: 'var(--red)' },
                { label: 'Open',      value: String(summary.open),              color: summary.open > 0 ? 'var(--blue)' : 'var(--text-2)' },
                { label: 'Total',     value: String(summary.total),             color: 'var(--text-1)' },
              ].map(({ label, value, color }, i, arr) => (
                <div key={label} style={{
                  padding: isMobile ? '10px 12px' : '14px 16px',
                  borderRight: isMobile ? (i % 3 < 2 ? '1px solid var(--border)' : 'none') : (i < arr.length - 1 ? '1px solid var(--border)' : 'none'),
                  borderBottom: isMobile && i < 3 ? '1px solid var(--border)' : 'none',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <span className="label" style={{ fontSize: '0.6rem' }}>{label}</span>
                  <span style={{ fontSize: isMobile ? '0.875rem' : '1rem', fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ── Filter + search bar ── */}
          <div style={{
            display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            padding: '10px 16px', borderBottom: '1px solid var(--border)', gap: 8,
            background: 'var(--inset)',
          }}>
            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 4 }}>
              {FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => resetPage(() => setFilter(key))}
                  style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 500,
                    border: '1px solid',
                    cursor: 'pointer', transition: 'all 0.13s',
                    background: filter === key ? 'var(--raised)' : 'transparent',
                    color: filter === key ? 'var(--text-1)' : 'var(--text-3)',
                    borderColor: filter === key ? 'var(--border-focus)' : 'transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{ position: 'absolute', left: 10, color: 'var(--text-3)', pointerEvents: 'none' }}>
                <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M8 8l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <input
                placeholder="Search instrument…"
                value={search}
                onChange={e => resetPage(() => setSearch(e.target.value))}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 7, padding: '5px 10px 5px 28px',
                  fontSize: '0.75rem', color: 'var(--text-1)', outline: 'none',
                  width: isMobile ? '100%' : 170, transition: 'border-color 150ms',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--border-focus)')}
                onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
              />
              {search && (
                <button
                  onClick={() => resetPage(() => setSearch(''))}
                  style={{
                    position: 'absolute', right: 8, background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--text-3)', fontSize: '0.75rem', lineHeight: 1,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* ── Table ── */}
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.875rem' }}>
              No trades match this filter
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: 'var(--raised)' }}>
                    {/* accent stripe col */}
                    <th style={{ width: 3, padding: 0 }} />
                    <th style={{ ...TH }}>Date</th>
                    <th style={{ ...TH }}>Instrument</th>
                    <th style={{ ...TH }}>Side</th>
                    {!isMobile && <th style={{ ...TH }}>Entry</th>}
                    {!isMobile && <th style={{ ...TH }}>Exit</th>}
                    {!isMobile && <th style={{ ...TH }}>Size</th>}
                    {!isMobile && <th style={{ ...TH }}>RR</th>}
                    <th style={{ ...TH }}>PnL</th>
                    <th style={{ ...TH }}>Status</th>
                    <th style={{ width: 80, padding: '10px 14px', borderBottom: '1px solid var(--border)' }} />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((trade, i) => {
                    const accent = rowAccent(trade);
                    const rr     = calcRR(trade);
                    const isLast = i === visible.length - 1;
                    return (
                      <tr
                        key={trade.id}
                        style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Accent stripe */}
                        <td style={{ padding: 0, width: 3 }}>
                          <div style={{ width: 3, height: '100%', minHeight: 44, background: accent, opacity: 0.85 }} />
                        </td>
                        <td style={{ ...TD, color: 'var(--text-3)' }}>{fmtDate(trade.date)}</td>
                        <td style={{ ...TD, color: 'var(--text-1)', fontWeight: 600 }}>{trade.instrument}</td>
                        <td style={{ ...TD }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: '0.75rem', fontWeight: 600,
                            color: trade.direction === 'long' ? 'var(--green)' : 'var(--red)',
                          }}>
                            {trade.direction === 'long' ? '▲' : '▼'}
                            {!isMobile && (trade.direction === 'long' ? 'Long' : 'Short')}
                          </span>
                        </td>
                        {!isMobile && (
                          <td style={{ ...TD, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
                            {fmtPrice(trade.entry_price)}
                          </td>
                        )}
                        {!isMobile && (
                          <td style={{ ...TD, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                            {trade.exit_price ? fmtPrice(trade.exit_price) : <span style={{ color: 'var(--text-4)' }}>—</span>}
                          </td>
                        )}
                        {!isMobile && (
                          <td style={{ ...TD, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
                            {trade.size}
                          </td>
                        )}
                        {!isMobile && (
                          <td style={{ ...TD }}>
                            {rr
                              ? <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)' }}>{rr}</span>
                              : <span style={{ color: 'var(--text-4)' }}>—</span>
                            }
                          </td>
                        )}
                        <td style={{
                          ...TD,
                          fontWeight: 700,
                          fontVariantNumeric: 'tabular-nums',
                          color: trade.pnl >= 0 ? 'var(--green)' : 'var(--red)',
                        }}>
                          {fmtPnL(trade.pnl)}
                        </td>
                        <td style={{ ...TD }}>
                          <span style={{
                            fontSize: '0.67rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                            background:
                              trade.status === 'open'      ? 'rgba(96,165,250,0.1)'  :
                              trade.status === 'closed'    ? 'rgba(16,185,129,0.1)'  :
                              'rgba(255,255,255,0.05)',
                            color:
                              trade.status === 'open'      ? 'var(--blue)'   :
                              trade.status === 'closed'    ? 'var(--green)'  :
                              'var(--text-3)',
                            border:
                              trade.status === 'open'      ? '1px solid rgba(96,165,250,0.22)'  :
                              trade.status === 'closed'    ? '1px solid rgba(16,185,129,0.22)'  :
                              '1px solid var(--border)',
                            textTransform: 'capitalize',
                          }}>
                            {trade.status}
                          </span>
                        </td>
                        <td style={{ ...TD, textAlign: 'right' }}>
                          {confirmDeleteId === trade.id ? (
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => { deleteTrade.mutate(trade.id); setConfirmDeleteId(null); }}
                                style={{
                                  padding: '3px 8px', borderRadius: 5, cursor: 'pointer',
                                  fontSize: '0.67rem', fontWeight: 700,
                                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
                                  color: '#ef4444',
                                }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                style={{
                                  padding: '3px 8px', borderRadius: 5, cursor: 'pointer',
                                  fontSize: '0.67rem', fontWeight: 600,
                                  background: 'var(--raised)', border: '1px solid var(--border)',
                                  color: 'var(--text-3)',
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => { setEditTradeId(trade.id); setAddTradeOpen(true); }}
                                title="Edit trade"
                                style={{
                                  padding: '4px 7px', borderRadius: 5, cursor: 'pointer',
                                  background: 'transparent', border: '1px solid transparent',
                                  color: 'var(--text-4)', fontSize: '0.75rem', transition: 'all 120ms',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                }}
                                onMouseEnter={e => {
                                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(96,165,250,0.1)';
                                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--blue)';
                                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(96,165,250,0.25)';
                                }}
                                onMouseLeave={e => {
                                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-4)';
                                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
                                }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(trade.id)}
                                title="Delete trade"
                                style={{
                                  padding: '4px 7px', borderRadius: 5, cursor: 'pointer',
                                  background: 'transparent', border: '1px solid transparent',
                                  color: 'var(--text-4)', fontSize: '0.75rem', transition: 'all 120ms',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                }}
                                onMouseEnter={e => {
                                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)';
                                  (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
                                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.25)';
                                }}
                                onMouseLeave={e => {
                                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-4)';
                                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
                                }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                  <path d="M10 11v6M14 11v6"/>
                                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          {pages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 16px', borderTop: '1px solid var(--border)',
              background: 'var(--inset)',
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
                {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, filtered.length)} of {filtered.length}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  disabled={safePage === 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{ ...PAGE_BTN, opacity: safePage === 1 ? 0.35 : 1 }}
                >
                  ←
                </button>

                {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        ...PAGE_BTN,
                        background: p === safePage ? 'var(--raised)' : 'transparent',
                        color:      p === safePage ? 'var(--text-1)' : 'var(--text-3)',
                        border:     p === safePage ? '1px solid var(--border-focus)' : '1px solid transparent',
                        minWidth: 28,
                      }}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  disabled={safePage === pages}
                  onClick={() => setPage(p => p + 1)}
                  style={{ ...PAGE_BTN, opacity: safePage === pages ? 0.35 : 1 }}
                >
                  →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Style constants ───────────────────────────────────────────────────
const TH: React.CSSProperties = {
  textAlign: 'left', padding: '10px 14px',
  fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.09em', color: 'var(--text-3)',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
};

const TD: React.CSSProperties = {
  padding: '12px 14px',
  verticalAlign: 'middle',
};

const PAGE_BTN: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '4px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 500,
  border: '1px solid transparent', background: 'transparent',
  color: 'var(--text-3)', cursor: 'pointer', transition: 'all 0.13s',
};
