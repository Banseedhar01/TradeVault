import { useState, useMemo } from 'react';
import { useCalendarData } from '../../hooks/useAnalytics';
import { useTrades, useDeleteTrade } from '../../hooks/useTrades';
import { useStore } from '../../store';
import { useIsMobile } from '../../hooks/useIsMobile';
import { Button } from '../ui/Button';
import { Trade } from '../../types/trade';

type DayEntry = {
  total_pnl: number;
  trade_count: number;
  winning_trades: number;
  losing_trades: number;
};

const fmtPnL = (v: number) => `${v >= 0 ? '+' : '−'}$${Math.abs(v).toFixed(0)}`;

const fmtPrice = (v: number) =>
  v < 10 ? v.toFixed(5) : v < 1000 ? v.toFixed(4) : v.toLocaleString(undefined, { maximumFractionDigits: 2 });

// ── Trade row in day panel ─────────────────────────────────────────────
const TradeRow = ({ trade, onDelete }: { trade: Trade; onDelete: (id: string) => void }) => {
  const [confirm, setConfirm] = useState(false);
  const win = trade.pnl > 0;
  const loss = trade.pnl < 0;
  const dir  = trade.direction === 'long';
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderBottom: '1px solid var(--border)', transition: 'background 100ms' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--raised)')}
      onMouseLeave={e => { (e.currentTarget.style.background = 'transparent'); setConfirm(false); }}
    >
      <span style={{
        fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
        background: dir ? 'rgba(96,165,250,0.1)' : 'rgba(239,68,68,0.1)',
        color: dir ? 'var(--blue)' : 'var(--red)',
        border: `1px solid ${dir ? 'rgba(96,165,250,0.2)' : 'rgba(239,68,68,0.2)'}`,
      }}>{trade.instrument}</span>
      <span style={{ fontSize: '0.67rem', fontWeight: 500, flexShrink: 0, color: dir ? 'var(--blue)' : 'var(--red)', opacity: 0.85 }}>
        {dir ? '↑ Long' : '↓ Short'}
      </span>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-3)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {fmtPrice(trade.entry_price)}
        {trade.exit_price != null && <span style={{ color: 'var(--text-4)', margin: '0 4px' }}>→</span>}
        {trade.exit_price != null && fmtPrice(trade.exit_price)}
      </span>
      <span style={{ fontSize: '0.67rem', color: 'var(--text-4)', flexShrink: 0 }}>{trade.size}</span>
      <span style={{
        fontSize: '0.75rem', fontWeight: 600, flexShrink: 0, minWidth: 48, textAlign: 'right',
        color: win ? 'var(--green)' : loss ? 'var(--red)' : 'var(--text-2)', opacity: 0.75,
      }}>
        {trade.pnl >= 0 ? '+' : '−'}${Math.abs(trade.pnl).toFixed(0)}
      </span>
      {confirm ? (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={() => onDelete(trade.id)} style={{
            padding: '2px 7px', borderRadius: 4, cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700,
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444',
          }}>✓</button>
          <button onClick={() => setConfirm(false)} style={{
            padding: '2px 7px', borderRadius: 4, cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600,
            background: 'var(--raised)', border: '1px solid var(--border)', color: 'var(--text-3)',
          }}>✕</button>
        </div>
      ) : (
        <button onClick={() => setConfirm(true)} style={{
          flexShrink: 0, padding: '3px 6px', borderRadius: 4, cursor: 'pointer',
          background: 'transparent', border: '1px solid transparent',
          color: 'var(--text-4)', fontSize: '0.7rem', transition: 'all 120ms',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.25)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-4)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; }}
        >🗑</button>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────
export const TradingCalendarCard = () => {
  const [cur, setCur]             = useState(new Date());
  const [hovered, setHovered]     = useState<{ day: number; entry: DayEntry } | null>(null);
  const [clickedDate, setClicked] = useState<string | null>(null);
  const { viewAccountId }         = useStore();
  const isMobile                  = useIsMobile();

  const { data, isLoading } = useCalendarData(viewAccountId, undefined, cur.getFullYear(), cur.getMonth() + 1);
  const { data: allTrades } = useTrades();
  const deleteTrade         = useDeleteTrade();

  const getDays = () => {
    const y = cur.getFullYear(), m = cur.getMonth();
    const firstDow = new Date(y, m, 1).getDay();
    const last     = new Date(y, m + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= last; d++)    cells.push(d);
    return cells;
  };

  const isoOf = (day: number): string => {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getEntry = (day: number | null): DayEntry | null => {
    if (!day || !data) return null;
    return data[isoOf(day)] ?? null;
  };

  const isToday = (day: number | null) =>
    day !== null &&
    new Date().getDate() === day &&
    new Date().getMonth() === cur.getMonth() &&
    new Date().getFullYear() === cur.getFullYear();

  const navigate = (d: -1 | 1) => {
    setHovered(null); setClicked(null);
    setCur(p => { const n = new Date(p); n.setMonth(n.getMonth() + d); return n; });
  };

  const goToday = () => { setHovered(null); setClicked(null); setCur(new Date()); };

  const isCurrentMonth =
    cur.getMonth() === new Date().getMonth() &&
    cur.getFullYear() === new Date().getFullYear();

  const days  = getDays();
  const month = cur.toLocaleString('default', { month: 'long', year: 'numeric' });

  const monthStats = useMemo(() => {
    if (!data) return null;
    const entries = Object.values(data);
    if (!entries.length) return null;
    const totalPnL    = entries.reduce((s, e) => s + e.total_pnl, 0);
    const totalTrades = entries.reduce((s, e) => s + e.trade_count, 0);
    const totalWins   = entries.reduce((s, e) => s + e.winning_trades, 0);
    const sorted      = [...entries].sort((a, b) => b.total_pnl - a.total_pnl);
    return {
      totalPnL, totalTrades,
      tradeDays: entries.length,
      winRate:   totalTrades ? (totalWins / totalTrades) * 100 : 0,
      bestDay:   sorted[0]?.total_pnl ?? 0,
      worstDay:  sorted[sorted.length - 1]?.total_pnl ?? 0,
    };
  }, [data]);

  const maxAbsPnL = useMemo(() => {
    if (!data) return 1;
    return Math.max(...Object.values(data).map(e => Math.abs(e.total_pnl)), 1);
  }, [data]);

  const dayTrades = useMemo<Trade[]>(() => {
    if (!clickedDate || !allTrades) return [];
    return allTrades.filter(t => {
      const tradeDate = t.date.split('T')[0];
      if (tradeDate !== clickedDate) return false;
      if (viewAccountId) return t.account_id === viewAccountId;
      return true;
    });
  }, [clickedDate, allTrades, viewAccountId]);

  const clickedEntry = clickedDate && data ? data[clickedDate] ?? null : null;

  const handleDayClick = (day: number) => {
    const iso = isoOf(day);
    setClicked(prev => (prev === iso ? null : iso));
  };

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div className="card-header">
        <span className="card-title">Trading Calendar</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {!isCurrentMonth && (
            <button onClick={goToday} style={{
              fontSize: '0.67rem', fontWeight: 500, padding: '3px 9px',
              borderRadius: 6, border: '1px solid var(--border)',
              background: 'var(--raised)', color: 'var(--text-2)', cursor: 'pointer',
            }}>Today</button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>←</Button>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-2)', fontWeight: 500, minWidth: 116, textAlign: 'center' }}>
              {month}
            </span>
            <Button variant="ghost" size="sm" onClick={() => navigate(1)}>→</Button>
          </div>
        </div>
      </div>

      <div className="card-body" style={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {isLoading ? (
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} className="animate-pulse"
                style={{ aspectRatio: '1', borderRadius: 6, background: 'var(--raised)' }} />
            ))}
          </div>
        ) : (
          <>
            {/* ── Monthly stats strip ── */}
            {monthStats && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', borderBottom: '1px solid var(--border)' }}>
                {[
                  { label: 'Month P&L',  value: fmtPnL(monthStats.totalPnL),              color: monthStats.totalPnL >= 0 ? 'var(--green)' : 'var(--red)' },
                  { label: 'Win Rate',   value: `${monthStats.winRate.toFixed(1)}%`,        color: monthStats.winRate >= 50 ? 'var(--green)' : 'var(--red)' },
                  { label: 'Best Day',   value: monthStats.bestDay > 0 ? fmtPnL(monthStats.bestDay) : '—',         color: 'var(--green)' },
                  { label: 'Worst Day',  value: monthStats.worstDay < 0 ? fmtPnL(monthStats.worstDay) : '—',       color: 'var(--red)' },
                ].map(({ label, value, color }, i, arr) => (
                  <div key={label} style={{
                    padding: '10px 14px',
                    borderRight: isMobile ? (i % 2 === 0 ? '1px solid var(--border)' : 'none') : (i < arr.length - 1 ? '1px solid var(--border)' : 'none'),
                    borderBottom: isMobile && i < 2 ? '1px solid var(--border)' : 'none',
                    display: 'flex', flexDirection: 'column', gap: 3,
                  }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{label}</span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Calendar grid ── */}
            <div style={{ padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 5 }}>

              {/* Weekday headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                  <div key={d} style={{
                    textAlign: 'center', fontSize: '0.62rem', fontWeight: 500, paddingBottom: 4,
                    color: i === 0 || i === 6 ? 'var(--text-4)' : 'var(--text-3)',
                    letterSpacing: '0.05em',
                  }}>{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                {days.map((day, idx) => {
                  const entry     = getEntry(day);
                  const today     = isToday(day);
                  const dow       = day ? new Date(cur.getFullYear(), cur.getMonth(), day).getDay() : idx % 7;
                  const isWeekend = dow === 0 || dow === 6;
                  const profit    = entry && entry.total_pnl > 0;
                  const loss      = entry && entry.total_pnl < 0;
                  const intensity = entry ? Math.min(Math.abs(entry.total_pnl) / maxAbsPnL, 1) : 0;
                  const isClicked = day ? clickedDate === isoOf(day) : false;
                  const isHov     = hovered?.day === day;

                  let bg = 'transparent', border = 'transparent';

                  if (day) {
                    if (profit) {
                      const a = (isClicked || isHov) ? intensity * 0.25 + 0.1 : intensity * 0.14 + 0.03;
                      bg     = `rgba(16,185,129,${a})`;
                      border = isClicked ? 'rgba(16,185,129,0.65)' : `rgba(16,185,129,${intensity * 0.28 + 0.1})`;
                    } else if (loss) {
                      const a = (isClicked || isHov) ? intensity * 0.25 + 0.1 : intensity * 0.14 + 0.03;
                      bg     = `rgba(239,68,68,${a})`;
                      border = isClicked ? 'rgba(239,68,68,0.65)' : `rgba(239,68,68,${intensity * 0.28 + 0.1})`;
                    } else if (today) {
                      bg = 'rgba(96,165,250,0.07)'; border = 'rgba(96,165,250,0.4)';
                    } else {
                      border = isHov ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)';
                    }
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() => day && handleDayClick(day)}
                      onMouseEnter={() => { if (day && entry) setHovered({ day, entry }); }}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        aspectRatio: '1', borderRadius: 6, padding: '3px 3px 2px',
                        display: 'flex', flexDirection: 'column', gap: 1,
                        border: `1px solid ${border}`,
                        background: day ? (isWeekend && !entry ? 'rgba(255,255,255,0.01)' : bg) : 'transparent',
                        opacity: !day ? 0 : (isWeekend && !entry ? 0.35 : 1),
                        transition: 'background 120ms, border-color 120ms, transform 80ms',
                        cursor: day ? 'pointer' : 'default',
                        transform: isClicked ? 'scale(0.95)' : 'scale(1)',
                        boxShadow: isClicked && entry ? `0 0 0 1.5px ${profit ? 'rgba(16,185,129,0.45)' : 'rgba(239,68,68,0.45)'}` : 'none',
                      }}
                    >
                      {day && (
                        <>
                          {/* Day number */}
                          <div style={{
                            fontSize: '0.65rem', fontWeight: 600, lineHeight: 1, paddingLeft: 2,
                            color: today   ? 'var(--blue)'
                              : profit     ? '#6ee7b7'
                              : loss       ? '#fca5a5'
                              : isWeekend  ? 'var(--text-3)'
                              : 'var(--text-2)',
                          }}>{day}</div>

                          {entry ? (
                            <>
                              {/* PnL */}
                              <div style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.62rem', fontWeight: 700, lineHeight: 1,
                                color: entry.total_pnl >= 0 ? 'var(--green)' : 'var(--red)',
                                letterSpacing: '-0.01em',
                              }}>
                                {fmtPnL(entry.total_pnl)}
                              </div>

                              {/* W / L pills */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                                {entry.winning_trades > 0 && (
                                  <span style={{ fontSize: '0.5rem', fontWeight: 600, color: '#6ee7b7', lineHeight: 1 }}>
                                    {entry.winning_trades}W
                                  </span>
                                )}
                                {entry.winning_trades > 0 && entry.losing_trades > 0 && (
                                  <span style={{ fontSize: '0.45rem', color: 'var(--text-3)', lineHeight: 1 }}>·</span>
                                )}
                                {entry.losing_trades > 0 && (
                                  <span style={{ fontSize: '0.5rem', fontWeight: 600, color: '#fca5a5', lineHeight: 1 }}>
                                    {entry.losing_trades}L
                                  </span>
                                )}
                              </div>
                            </>
                          ) : (
                            <div style={{ flex: 1 }} />
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Hover / legend strip ── */}
              <div style={{
                paddingTop: 8, borderTop: '1px solid var(--border)',
                minHeight: 26, display: 'flex', alignItems: 'center',
              }}>
                {hovered ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-2)', fontWeight: 600 }}>
                      {new Date(`${isoOf(hovered.day)}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {[
                        { label: 'PnL',    value: fmtPnL(hovered.entry.total_pnl), color: hovered.entry.total_pnl >= 0 ? 'var(--green)' : 'var(--red)' },
                        { label: 'Trades', value: String(hovered.entry.trade_count), color: 'var(--text-1)' },
                        { label: 'W / L',  value: `${hovered.entry.winning_trades}/${hovered.entry.losing_trades}`, color: 'var(--text-2)' },
                      ].map(({ label, value, color }) => (
                        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <span style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color, lineHeight: 1, opacity: 0.85 }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {[
                        { color: 'rgba(16,185,129,0.5)',  label: 'Profit' },
                        { color: 'rgba(239,68,68,0.5)',   label: 'Loss'   },
                        { color: 'rgba(96,165,250,0.5)',  label: 'Today'  },
                      ].map(({ color, label }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 6, height: 6, borderRadius: 2, background: color }} />
                          <span style={{ fontSize: '0.63rem', color: 'var(--text-4)' }}>{label}</span>
                        </div>
                      ))}
                    </div>
                    {monthStats && (
                      <span style={{ fontSize: '0.63rem', color: 'var(--text-4)' }}>
                        {monthStats.tradeDays} trading {monthStats.tradeDays === 1 ? 'day' : 'days'} · {monthStats.totalTrades} trades
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Clicked day panel ── */}
            {clickedDate && (
              <div style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                {/* Panel header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 14px', background: 'var(--raised)',
                  borderBottom: '1px solid var(--border)', flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-1)' }}>
                      {new Date(`${clickedDate}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {clickedEntry ? (
                      <>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: clickedEntry.total_pnl >= 0 ? 'var(--green)' : 'var(--red)', opacity: 0.85 }}>
                          {fmtPnL(clickedEntry.total_pnl)}
                        </span>
                        <span style={{
                          fontSize: '0.62rem', fontWeight: 500, padding: '2px 7px', borderRadius: 4,
                          background: 'var(--inset)', border: '1px solid var(--border)', color: 'var(--text-3)',
                        }}>
                          {clickedEntry.trade_count} trade{clickedEntry.trade_count !== 1 ? 's' : ''}
                          {' · '}
                          <span style={{ color: 'rgba(110,231,183,0.8)' }}>{clickedEntry.winning_trades}W</span>
                          {' '}
                          <span style={{ color: 'rgba(252,165,165,0.8)' }}>{clickedEntry.losing_trades}L</span>
                        </span>
                      </>
                    ) : (
                      <span style={{
                        fontSize: '0.62rem', fontWeight: 500, padding: '2px 7px', borderRadius: 4,
                        background: 'var(--inset)', border: '1px solid var(--border)', color: 'var(--text-4)',
                      }}>No trades</span>
                    )}
                  </div>
                  <button onClick={() => setClicked(null)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-4)', fontSize: '0.875rem', lineHeight: 1, padding: '2px 4px', borderRadius: 4,
                  }}>✕</button>
                </div>

                {/* Trade rows */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {dayTrades.length === 0 ? (
                    <div style={{ padding: '20px 14px', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.78rem' }}>
                      No trades recorded for this day
                    </div>
                  ) : (
                    dayTrades.map(trade => (
                      <TradeRow key={trade.id} trade={trade} onDelete={(id) => deleteTrade.mutate(id)} />
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
