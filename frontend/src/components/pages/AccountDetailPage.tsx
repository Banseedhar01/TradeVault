import { Layout } from '../layout/Layout';
import { TradeLogCard } from '../cards/TradeLogCard';
import { TradingCalendarCard } from '../cards/TradingCalendarCard';
import { PerformanceCard } from '../cards/PerformanceCard';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { AddTradeForm } from '../forms/AddTradeForm';
import { useStore } from '../../store';
import { useAccounts } from '../../hooks/useAccounts';
import { useFirms } from '../../hooks/useFirms';
import { useIsMobile } from '../../hooks/useIsMobile';

const STATUS_COLOR: Record<string, string> = {
  passed:      '#10b981',
  failed:      '#ef4444',
  in_progress: '#60a5fa',
  live:        '#fbbf24',
};

const STATUS_LABEL: Record<string, string> = {
  passed:      'Passed',
  failed:      'Failed',
  in_progress: 'Active',
  live:        'Live',
};

export const AccountDetailPage = () => {
  const { detailAccountId, setDetailAccountId } = useStore();
  const { data: accounts } = useAccounts();
  const { data: firms }    = useFirms();
  const isMobile           = useIsMobile();

  const account = accounts?.find(a => a.id === detailAccountId);
  const firm    = firms?.find(f => f.id === account?.firm_id);

  if (!account || !firm) {
    return (
      <Layout>
        <div style={{ padding: '28px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <span style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Loading account…</span>
        </div>
      </Layout>
    );
  }

  const stage        = account.stages[account.current_stage];
  const isForex      = firm.market_type === 'forex';
  const accent       = isForex ? '#3b82f6' : '#f59e0b';
  const accentDim    = isForex ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)';
  const accentBorder = isForex ? 'rgba(59,130,246,0.22)' : 'rgba(245,158,11,0.22)';
  const hasFees      = account.fees != null && account.fees > 0;
  const pnl          = stage.current_pnl;
  const pnlPos       = pnl > 0;

  const stageColor  = STATUS_COLOR[stage.status] ?? 'var(--text-3)';
  const stageLabel  = STATUS_LABEL[stage.status] ?? 'Stage';

  return (
    <Layout>
      <div style={{ width: '100%', padding: isMobile ? '0 16px 32px' : '0 24px 40px', boxSizing: 'border-box' }}>

        {/* ── Sticky back bar ── */}
        <div style={{
          position: 'sticky', top: 56, zIndex: 40,
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 0 12px',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          marginBottom: 20,
        }}>
          <button
            onClick={() => setDetailAccountId(undefined)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 7, cursor: 'pointer',
              background: 'var(--raised)', border: '1px solid var(--border)',
              color: 'var(--text-2)', fontSize: '0.8rem', fontWeight: 600,
              transition: 'all 120ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = accent; (e.currentTarget as HTMLButtonElement).style.color = accent; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-2)'; }}
          >
            ← Back
          </button>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>
            Dashboard
            <span style={{ margin: '0 5px' }}>/</span>
            <span style={{ color: 'var(--text-3)' }}>{firm.name}</span>
            <span style={{ margin: '0 5px' }}>/</span>
            <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{account.plan_name}</span>
          </span>
        </div>

        {/* ── Hero card ── */}
        <div className="card" style={{ marginBottom: 20, overflow: 'hidden' }}>

          {/* Accent bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}60)` }} />

          {/* Header section */}
          <div style={{
            padding: '18px 22px 16px',
            background: `linear-gradient(160deg, ${accentDim} 0%, transparent 50%)`,
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
          }}>
            {/* Left: identity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.2 }}>
                  {firm.name}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>{account.plan_name}</span>
                  <span style={{ color: 'var(--text-4)' }}>·</span>
                  <span>${account.account_size.toLocaleString()}</span>
                  <span style={{ color: 'var(--text-4)' }}>·</span>
                  <span>{account.leverage}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                <Badge variant={isForex ? 'info' : 'warning'}>{isForex ? 'Forex' : 'Futures'}</Badge>
                <Badge variant="neutral">{firm.platform}</Badge>
                {hasFees && (
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                    background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)',
                    color: '#60a5fa',
                  }}>
                    ${account.fees!.toLocaleString()} fee
                  </span>
                )}
                {account.start_date && (
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                    color: 'var(--text-3)',
                  }}>
                    Started {new Date(`${account.start_date}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>

            {/* Right: stage pills + P&L callout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: isMobile ? 'auto' : 260, width: isMobile ? '100%' : 'auto' }}>
              {/* Stage pills */}
              <div style={{ display: 'flex', gap: 3, background: 'var(--inset)', borderRadius: 7, padding: 3, border: '1px solid var(--border)' }}>
                {account.stages.map((s, i) => {
                  const active = i === account.current_stage;
                  const color  = STATUS_COLOR[s.status] ?? 'var(--text-3)';
                  return (
                    <div key={i} style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      padding: '5px 10px', borderRadius: 5, fontSize: '0.72rem', fontWeight: active ? 600 : 400,
                      background: active ? 'var(--raised)' : 'transparent',
                      color: active ? color : 'var(--text-4)',
                      border: active ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
                    }}>
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                        background: active ? color : 'rgba(255,255,255,0.12)',
                        boxShadow: active && s.status === 'in_progress' ? `0 0 6px ${color}` : 'none',
                      }} />
                      {s.name}
                    </div>
                  );
                })}
              </div>

              {/* P&L callout */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 8,
                background: pnlPos ? 'rgba(16,185,129,0.07)' : pnl < 0 ? 'rgba(239,68,68,0.07)' : 'var(--inset)',
                border: `1px solid ${pnlPos ? 'rgba(16,185,129,0.18)' : pnl < 0 ? 'rgba(239,68,68,0.18)' : 'var(--border)'}`,
              }}>
                <div>
                  <div style={{ fontSize: '0.58rem', fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Current P&L
                  </div>
                  <div style={{
                    fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 3,
                    color: pnlPos ? '#10b981' : pnl < 0 ? '#ef4444' : 'var(--text-2)', opacity: 0.85,
                  }}>
                    {pnlPos ? '+' : ''}{pnl < 0 ? '-' : ''}${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.58rem', fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Status
                  </div>
                  <div style={{
                    fontSize: '0.8rem', fontWeight: 700, marginTop: 3,
                    color: stageColor,
                  }}>
                    {stageLabel}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 4-metric strip ── */}
          <div style={{
            display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            borderBottom: '1px solid var(--border)',
          }}>
            {[
              { label: 'Profit Target', value: `$${stage.profit_target.toLocaleString()}`,  color: '#10b981' },
              { label: 'Max Loss',      value: `$${stage.max_loss.toLocaleString()}`,        color: '#ef4444' },
              { label: 'Daily Loss',    value: `$${stage.max_daily_loss.toLocaleString()}`,  color: '#f59e0b' },
              { label: 'Profit Split',  value: `${stage.profit_split}%`,                    color: '#a1a1aa' },
            ].map(({ label, value, color }, i, arr) => (
              <div key={label} style={{
                padding: '12px 18px',
                borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'flex', flexDirection: 'column', gap: 4,
                background: 'var(--inset)',
              }}>
                <span style={{ fontSize: '0.58rem', fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {label}
                </span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1, opacity: 0.75 }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* ── Progress bars ── */}
          <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ProgressBar value={stage.current_pnl}           max={stage.profit_target}  variant="profit"  label="Profit Progress" />
            <ProgressBar value={Math.abs(stage.current_pnl)} max={stage.max_loss}        variant="loss"    label="Drawdown" />
            <ProgressBar value={stage.daily_loss_used}       max={stage.max_daily_loss}  variant="warning" label="Daily Loss" />

            {/* Perks */}
            {(stage.min_trading_days === 0 || stage.on_demand_payout || stage.profit_split >= 80) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                {stage.min_trading_days === 0 && <Badge variant="info">No Time Limit</Badge>}
                {stage.on_demand_payout       && <Badge variant="success">On-Demand Payout</Badge>}
                {stage.profit_split >= 80     && <Badge variant="success">High Split</Badge>}
              </div>
            )}
          </div>
        </div>

        {/* ── Data cards ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TradeLogCard />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            <TradingCalendarCard />
            <PerformanceCard />
          </div>
        </div>

      </div>

      <AddTradeForm />
    </Layout>
  );
};
