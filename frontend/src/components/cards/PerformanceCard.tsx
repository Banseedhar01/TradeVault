import { useState } from 'react';
import { useStore } from '../../store';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, Tooltip, Cell, ReferenceLine,
} from 'recharts';
import { useAnalytics, useEquityCurve } from '../../hooks/useAnalytics';
import { CardSkeleton } from '../ui/SkeletonLoader';

type Range = '1W' | '1M' | '3M' | 'YTD' | 'All';

const DAYS: Record<Range, number> = {
  '1W': 7, '1M': 30, '3M': 90,
  'YTD': Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000),
  'All': 365,
};

const EqTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value as number;
  return (
    <div style={{
      background: 'var(--raised)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 12px', fontSize: '0.72rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    }}>
      <div style={{ color: 'var(--text-3)', marginBottom: 4, fontSize: '0.65rem' }}>
        {new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>
      <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>${val?.toFixed(0)}</div>
    </div>
  );
};

const PnlTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value as number;
  return (
    <div style={{
      background: 'var(--raised)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 12px', fontSize: '0.72rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    }}>
      <div style={{ color: 'var(--text-3)', marginBottom: 4, fontSize: '0.65rem' }}>{label}</div>
      <div style={{ fontWeight: 700, color: val >= 0 ? 'var(--green)' : 'var(--red)' }}>
        {val >= 0 ? '+' : ''}${val?.toFixed(2)}
      </div>
    </div>
  );
};

export const PerformanceCard = () => {
  const [range, setRange] = useState<Range>('1M');
  const days = DAYS[range];
  const { viewAccountId } = useStore();
  const { data: analytics, isLoading: al } = useAnalytics(viewAccountId, undefined, days);
  const { data: equity,    isLoading: el } = useEquityCurve(viewAccountId, undefined, days);

  if (al || el) return <CardSkeleton />;

  const pnlBars = equity?.slice(-14).map(p => ({
    date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    pnl:  p.daily_pnl,
  })) ?? [];

  const totalPnl = analytics?.total_pnl      ?? 0;
  const winRate  = analytics?.win_rate        ?? 0;
  const pf       = analytics?.profit_factor   ?? 0;
  const rr       = analytics?.avg_rr          ?? 0;
  const trades   = analytics?.total_trades    ?? 0;
  const cWins    = analytics?.consecutive_wins   ?? 0;
  const cLosses  = analytics?.consecutive_losses ?? 0;
  const streak   = cWins >= cLosses
    ? { n: cWins,   type: 'W' as const }
    : { n: cLosses, type: 'L' as const };

  const chartInset: React.CSSProperties = {
    background: 'var(--inset)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '10px 4px 4px',
  };

  return (
    <div className="card" style={{ height: '100%' }}>

      {/* ── Header ── */}
      <div className="card-header">
        <span className="card-title">Performance</span>
        <div className="pill-group">
          {(['1W', '1M', '3M', 'YTD', 'All'] as Range[]).map(r => (
            <button key={r} className={`pill-tab ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', borderBottom: '1px solid var(--border)' }}>
        {[
          {
            label: 'Net PnL',
            value: `${totalPnl >= 0 ? '+' : '-'}$${Math.abs(totalPnl).toFixed(0)}`,
            color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)',
          },
          {
            label: 'Win Rate',
            value: `${winRate.toFixed(1)}%`,
            color: winRate >= 50 ? 'var(--green)' : 'var(--red)',
          },
          {
            label: 'Profit Factor',
            value: pf.toFixed(2),
            color: pf >= 1.5 ? 'var(--green)' : pf >= 1 ? 'var(--amber)' : 'var(--red)',
          },
          {
            label: 'Avg RR',
            value: `${rr.toFixed(1)}R`,
            color: rr >= 1.5 ? 'var(--green)' : rr >= 1 ? 'var(--amber)' : 'var(--red)',
          },
          {
            label: 'Trades',
            value: String(trades),
            color: 'var(--text-1)',
          },
          {
            label: 'Streak',
            value: streak.n > 0 ? `${streak.n}${streak.type}` : '—',
            color: streak.type === 'W' && streak.n > 0 ? 'var(--green)' : streak.n > 0 ? 'var(--red)' : 'var(--text-3)',
          },
        ].map(({ label, value, color }, i, arr) => (
          <div key={label} style={{
            padding: '11px 10px',
            borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <span className="label" style={{ fontSize: '0.58rem' }}>{label}</span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1, opacity: 0.75 }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="card-body" style={{ gap: 16 }}>

        {/* ── Equity Curve ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="label">Equity Curve</span>
            {equity?.length ? (
              <span style={{ fontSize: '0.67rem', color: 'var(--text-3)' }}>
                ${equity[equity.length - 1]?.balance.toFixed(0)}
              </span>
            ) : null}
          </div>
          <div style={{ ...chartInset, height: 116 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equity ?? []} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date" axisLine={false} tickLine={false}
                  tick={{ fontSize: 9.5, fill: 'var(--text-4)' }}
                  tickFormatter={v => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  interval="preserveStartEnd"
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip content={<EqTip />} />
                <Area
                  type="monotone" dataKey="balance"
                  stroke="#10b981" strokeWidth={1.75}
                  fill="url(#eqGrad)" dot={false}
                  activeDot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Daily PnL bars ── */}
        <div>
          <span className="label" style={{ display: 'block', marginBottom: 8 }}>Daily PnL — Last 14 Days</span>
          <div style={{ ...chartInset, height: 84 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pnlBars} barSize={8} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                <XAxis dataKey="date" axisLine={false} tickLine={false}
                  tick={{ fontSize: 9, fill: 'var(--text-4)' }} interval={1} />
                <YAxis hide />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                <Tooltip content={<PnlTip />} />
                <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                  {pnlBars.map((e, i) => (
                    <Cell key={i} fill={e.pnl >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.83} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Secondary metrics ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { label: 'Avg Win',     value: `+$${(analytics?.avg_win     ?? 0).toFixed(0)}`, color: 'var(--green)' },
            { label: 'Avg Loss',    value: `-$${Math.abs(analytics?.avg_loss    ?? 0).toFixed(0)}`, color: 'var(--red)' },
            { label: 'Best Trade',  value: `+$${(analytics?.largest_win  ?? 0).toFixed(0)}`, color: 'var(--green)' },
            { label: 'Worst Trade', value: `-$${Math.abs(analytics?.largest_loss ?? 0).toFixed(0)}`, color: 'var(--red)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="stat-tile" style={{ padding: '9px 10px', gap: 3 }}>
              <span className="stat-label" style={{ fontSize: '0.57rem' }}>{label}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color, lineHeight: 1, opacity: 0.75 }}>{value}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
