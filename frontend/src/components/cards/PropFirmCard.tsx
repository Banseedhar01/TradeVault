import { useState } from 'react';
import { PropFirm } from '../../types/firm';
import { Account } from '../../types/account';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { useStore } from '../../store';
import { useDeleteAccount } from '../../hooks/useAccounts';
import { useIsMobile } from '../../hooks/useIsMobile';

interface PropFirmCardProps {
  firm: PropFirm;
  accounts: Account[];
}

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

export const PropFirmCard = ({ firm, accounts }: PropFirmCardProps) => {
  const { setAddAccountOpen, setSelectedFirmId, activeSection, setDetailAccountId } = useStore();
  const deleteAccount = useDeleteAccount();
  const isMobile = useIsMobile();
  const [isHovered, setIsHovered]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const account    = accounts[0];
  const isForex    = activeSection === 'forex';
  const accent     = isForex ? '#3b82f6' : '#f59e0b';
  const accentDim  = isForex ? 'rgba(59,130,246,0.12)' : 'rgba(245,158,11,0.12)';
  const accentBorder = isForex ? 'rgba(59,130,246,0.25)' : 'rgba(245,158,11,0.25)';

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFirmId(firm.id);
    setAddAccountOpen(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!account) return;
    if (confirmDelete) { deleteAccount.mutate(account.id); setConfirmDelete(false); }
    else setConfirmDelete(true);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(false);
  };

  // ── Empty state ────────────────────────────────────────────────
  if (!account) {
    return (
      <div className="card" style={{ flexShrink: 0, width: isMobile ? '82vw' : 288 }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}80)` }} />
        <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-1)' }}>{firm.name}</div>
          <div style={{ display: 'flex', gap: 5, marginTop: 7 }}>
            <Badge variant={isForex ? 'info' : 'warning'}>{isForex ? 'Forex' : 'Futures'}</Badge>
            <Badge variant="neutral">{firm.platform}</Badge>
          </div>
        </div>
        <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: accentDim, border: `1px solid ${accentBorder}`,
            fontSize: '1.1rem',
          }}>
            📋
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-2)' }}>No account configured</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-4)', marginTop: 3 }}>Add an account to start tracking</div>
          </div>
          <button onClick={handleAdd} style={{
            padding: '7px 18px', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
            background: accentDim, border: `1px solid ${accentBorder}`, color: accent,
            transition: 'all 120ms',
          }}>
            + Add Account
          </button>
        </div>
      </div>
    );
  }

  const stage   = account.stages[account.current_stage];
  const hasFees = account.fees != null && account.fees > 0;
  const pnl     = stage.current_pnl;
  const pnlPos  = pnl >= 0;

  // ── With account ───────────────────────────────────────────────
  return (
    <div
      className="card"
      onClick={() => setDetailAccountId(account.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setConfirmDelete(false); }}
      style={{ flexShrink: 0, width: isMobile ? '82vw' : 288, cursor: 'pointer', transition: 'box-shadow 150ms, transform 120ms',
        boxShadow: isHovered ? `0 0 0 1px ${accentBorder}, 0 8px 24px rgba(0,0,0,0.25)` : undefined,
        transform: isHovered ? 'translateY(-1px)' : undefined,
      }}
    >
      {/* Accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}60)` }} />

      {/* ── Header ── */}
      <div style={{
        padding: '13px 14px 11px',
        background: `linear-gradient(160deg, ${accentDim} 0%, transparent 55%)`,
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          {/* Firm identity */}
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-1)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {firm.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>{account.plan_name}</span>
              <span style={{ color: 'var(--text-4)' }}>·</span>
              <span>${account.account_size.toLocaleString()}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            {confirmDelete ? (
              <>
                <button onClick={handleDelete} style={{
                  padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700,
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444',
                }}>Confirm</button>
                <button onClick={handleCancelDelete} style={{
                  padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontSize: '0.68rem', fontWeight: 600,
                  background: 'var(--raised)', border: '1px solid var(--border)', color: 'var(--text-3)',
                }}>Cancel</button>
              </>
            ) : (
              <button onClick={handleDelete} title="Delete account" style={{
                width: 26, height: 26, borderRadius: 5, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: '1px solid transparent',
                color: 'var(--text-4)', fontSize: '0.75rem', transition: 'all 120ms',
              }}
                onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(239,68,68,0.1)'; b.style.color = '#ef4444'; b.style.borderColor = 'rgba(239,68,68,0.25)'; }}
                onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'transparent'; b.style.color = 'var(--text-4)'; b.style.borderColor = 'transparent'; }}
              >🗑</button>
            )}
            <button onClick={handleAdd} style={{
              padding: '3px 10px', borderRadius: 5, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
              background: accentDim, border: `1px solid ${accentBorder}`, color: accent, transition: 'all 120ms',
            }}>+ Add</button>
          </div>
        </div>

        {/* Badges row */}
        <div style={{ display: 'flex', gap: 5, marginTop: 9, flexWrap: 'wrap', alignItems: 'center' }}>
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
        </div>
      </div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── Stage pills ── */}
        <div style={{ display: 'flex', gap: 3, background: 'var(--inset)', borderRadius: 7, padding: 3, border: '1px solid var(--border)' }}>
          {account.stages.map((s, i) => {
            const active = i === account.current_stage;
            const color  = STATUS_COLOR[s.status] ?? 'var(--text-3)';
            return (
              <div key={i} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: '4px 0', borderRadius: 5, fontSize: '0.67rem', fontWeight: active ? 600 : 400,
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

        {/* ── Current PnL callout ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 12px', borderRadius: 8,
          background: pnlPos ? 'rgba(16,185,129,0.07)' : pnl < 0 ? 'rgba(239,68,68,0.07)' : 'var(--inset)',
          border: `1px solid ${pnlPos ? 'rgba(16,185,129,0.18)' : pnl < 0 ? 'rgba(239,68,68,0.18)' : 'var(--border)'}`,
        }}>
          <div>
            <div style={{ fontSize: '0.58rem', fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Current P&L
            </div>
            <div style={{
              fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginTop: 2, opacity: 0.75,
              color: pnlPos ? '#10b981' : pnl < 0 ? '#ef4444' : 'var(--text-2)',
            }}>
              {pnlPos ? '+' : ''}{pnl < 0 ? '-' : ''}${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.58rem', fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {STATUS_LABEL[stage.status] ?? 'Stage'}
            </div>
            <div style={{
              fontSize: '0.7rem', fontWeight: 700, marginTop: 2,
              color: STATUS_COLOR[stage.status] ?? 'var(--text-3)',
            }}>
              {account.leverage}
            </div>
          </div>
        </div>

        {/* ── 4-metric strip ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          borderRadius: 8, overflow: 'hidden',
          border: '1px solid var(--border)',
        }}>
          {[
            { label: 'Target',  value: `$${stage.profit_target.toLocaleString()}`,  color: '#10b981' },
            { label: 'Max Loss', value: `$${stage.max_loss.toLocaleString()}`,       color: '#ef4444' },
            { label: 'Daily Loss', value: `$${stage.max_daily_loss.toLocaleString()}`, color: '#f59e0b' },
            { label: 'Split',   value: `${stage.profit_split}%`,                    color: '#a1a1aa' },
          ].map(({ label, value, color }, i) => (
            <div key={label} style={{
              padding: '8px 0', textAlign: 'center',
              borderRight: isMobile ? (i % 2 === 0 ? '1px solid var(--border)' : 'none') : (i < 3 ? '1px solid var(--border)' : 'none'),
              borderBottom: isMobile && i < 2 ? '1px solid var(--border)' : 'none',
              background: 'var(--inset)',
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1, opacity: 0.72 }}>
                {value}
              </div>
              <div style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Progress bars ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ProgressBar value={stage.current_pnl}           max={stage.profit_target} variant="profit"  label="Profit" />
          <ProgressBar value={Math.abs(stage.current_pnl)} max={stage.max_loss}       variant="loss"    label="Drawdown" />
          <ProgressBar value={stage.daily_loss_used}       max={stage.max_daily_loss} variant="warning" label="Daily Loss" />
        </div>

        {/* ── Perks ── */}
        {(stage.min_trading_days === 0 || stage.on_demand_payout || stage.profit_split >= 80) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {stage.min_trading_days === 0 && <Badge variant="info">No Time Limit</Badge>}
            {stage.on_demand_payout       && <Badge variant="success">On-Demand Payout</Badge>}
            {stage.profit_split >= 80     && <Badge variant="success">High Split</Badge>}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: '7px 14px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6,
        fontSize: '0.68rem', fontWeight: 600,
        color: isHovered ? accent : 'var(--text-4)',
        transition: 'color 150ms',
      }}>
        View details
        <span style={{ transform: isHovered ? 'translateX(2px)' : 'none', transition: 'transform 150ms', display: 'inline-block' }}>→</span>
      </div>
    </div>
  );
};
