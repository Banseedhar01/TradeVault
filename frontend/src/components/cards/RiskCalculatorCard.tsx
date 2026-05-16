import { useState } from 'react';
import { useStore } from '../../store';
import { useIsMobile } from '../../hooks/useIsMobile';

type RiskMode = 'pct' | 'amt';
type TpMode   = 'ratio' | 'price';

const FUT_PV: Record<string, number> = { NQ: 20, ES: 50, MNQ: 2, MES: 5 };
const RR_PRESETS = [1, 1.5, 2, 2.5, 3];

const tog = (active: boolean): React.CSSProperties => ({
  padding: '3px 10px', borderRadius: 5, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600,
  background: active ? 'var(--blue)' : 'var(--raised)',
  border: `1px solid ${active ? 'var(--blue)' : 'var(--border)'}`,
  color: active ? '#fff' : 'var(--text-3)',
  transition: 'all 120ms',
});

const Field = ({
  label, value, step = 1, decimals = 2, onChange,
}: { label: string; value: number; step?: number; decimals?: number; onChange: (v: number) => void }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span className="label">{label}</span>
    <input
      type="number"
      className="input-field"
      value={value === 0 ? '' : value}
      step={step}
      onChange={e => onChange(Number(e.target.value))}
      style={{ fontSize: '0.8125rem' }}
    />
  </div>
);

const Metric = ({ label, value, color = 'var(--text-1)', large = false }: {
  label: string; value: string; color?: string; large?: boolean;
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{label}</span>
    <span style={{ fontSize: large ? '1rem' : '0.8125rem', fontWeight: large ? 800 : 700, color, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</span>
  </div>
);

export const RiskCalculatorCard = () => {
  const { activeSection } = useStore();
  const isForex = activeSection === 'forex';
  const isMobile = useIsMobile();

  const [riskMode, setRiskMode] = useState<RiskMode>('pct');
  const [tpMode,   setTpMode]   = useState<TpMode>('ratio');

  const [fx, setFx] = useState({
    accountSize: 10000, riskPct: 1, riskAmt: 100,
    entry: 1.0950, stop: 1.0916, rrRatio: 2, tpPrice: 1.1018,
  });
  const [fut, setFut] = useState({
    accountSize: 50000, riskPct: 1, riskAmt: 500,
    instrument: 'NQ', entry: 16500, stop: 16450, rrRatio: 2, tpPrice: 16600,
  });

  // ── Forex calc ──────────────────────────────────────────────────────────
  const fxCalc = () => {
    const risk    = riskMode === 'pct' ? (fx.accountSize * fx.riskPct) / 100 : fx.riskAmt;
    const isLong  = fx.entry >= fx.stop;
    const stopDist = Math.abs(fx.entry - fx.stop);
    const pips    = stopDist * 10000;
    const lotSize = pips > 0 ? risk / (pips * 10) : 0; // $10/pip/std lot

    const tp = tpMode === 'ratio'
      ? (isLong ? fx.entry + stopDist * fx.rrRatio : fx.entry - stopDist * fx.rrRatio)
      : fx.tpPrice;

    const tpDist = Math.abs(tp - fx.entry);
    const rr     = stopDist > 0 ? tpDist / stopDist : 0;
    const reward = risk * rr;

    return { risk, pips, lotSize, tp, rr, reward, isLong };
  };

  // ── Futures calc ─────────────────────────────────────────────────────────
  const futCalc = () => {
    const risk     = riskMode === 'pct' ? (fut.accountSize * fut.riskPct) / 100 : fut.riskAmt;
    const pv       = FUT_PV[fut.instrument] || 20;
    const isLong   = fut.entry >= fut.stop;
    const stopDist = Math.abs(fut.entry - fut.stop);
    const contracts = stopDist > 0 ? risk / (stopDist * pv) : 0;

    const tp = tpMode === 'ratio'
      ? (isLong ? fut.entry + stopDist * fut.rrRatio : fut.entry - stopDist * fut.rrRatio)
      : fut.tpPrice;

    const tpDist = Math.abs(tp - fut.entry);
    const rr     = stopDist > 0 ? tpDist / stopDist : 0;
    const reward = risk * rr;

    return { risk, pv, stopDist, contracts, tp, rr, reward, isLong };
  };

  const fc = fxCalc();
  const ft = futCalc();

  const rrValue  = isForex ? fc.rr  : ft.rr;
  const tpValue  = isForex ? fc.tp  : ft.tp;
  const entry    = isForex ? fx.entry : fut.entry;
  const isLong   = isForex ? fc.isLong : ft.isLong;

  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <span className="card-title">Risk Calculator</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 500 }}>
          {isForex ? 'Forex · Standard Lot' : 'Futures · Point Value'}
        </span>
      </div>

      <div className="card-body" style={{ flexDirection: isMobile ? 'column' : 'row', gap: 20, padding: 20, alignItems: 'flex-start' }}>

        {/* ── Inputs ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Risk mode toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="label">Risk</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button style={tog(riskMode === 'pct')} onClick={() => setRiskMode('pct')}>%</button>
                <button style={tog(riskMode === 'amt')} onClick={() => setRiskMode('amt')}>$</button>
              </div>
            </div>
            {isForex ? (
              <>
                <Field label="Account Size ($)" value={fx.accountSize} step={1000}
                  onChange={v => setFx(p => ({ ...p, accountSize: v }))} />
                {riskMode === 'pct'
                  ? <Field label="Risk %" value={fx.riskPct} step={0.1} decimals={1}
                      onChange={v => setFx(p => ({ ...p, riskPct: v }))} />
                  : <Field label="Risk Amount ($)" value={fx.riskAmt} step={10}
                      onChange={v => setFx(p => ({ ...p, riskAmt: v }))} />
                }
              </>
            ) : (
              <>
                <Field label="Account Size ($)" value={fut.accountSize} step={1000}
                  onChange={v => setFut(p => ({ ...p, accountSize: v }))} />
                {riskMode === 'pct'
                  ? <Field label="Risk %" value={fut.riskPct} step={0.1} decimals={1}
                      onChange={v => setFut(p => ({ ...p, riskPct: v }))} />
                  : <Field label="Risk Amount ($)" value={fut.riskAmt} step={50}
                      onChange={v => setFut(p => ({ ...p, riskAmt: v }))} />
                }
              </>
            )}
          </div>

          {/* Entry / Stop */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
            {isForex ? (
              <>
                <Field label="Entry" value={fx.entry} step={0.0001} decimals={4}
                  onChange={v => setFx(p => ({ ...p, entry: v }))} />
                <Field label="Stop Loss" value={fx.stop} step={0.0001} decimals={4}
                  onChange={v => setFx(p => ({ ...p, stop: v }))} />
              </>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="label">Instrument</span>
                  <select className="input-field" style={{ appearance: 'none', cursor: 'pointer', fontSize: '0.8125rem' }}
                    value={fut.instrument} onChange={e => setFut(p => ({ ...p, instrument: e.target.value }))}>
                    <option value="NQ">NQ — $20/pt</option>
                    <option value="ES">ES — $50/pt</option>
                    <option value="MNQ">MNQ — $2/pt</option>
                    <option value="MES">MES — $5/pt</option>
                  </select>
                </div>
                {!isMobile && <div />}
                <Field label="Entry" value={fut.entry} step={0.25}
                  onChange={v => setFut(p => ({ ...p, entry: v }))} />
                <Field label="Stop Loss" value={fut.stop} step={0.25}
                  onChange={v => setFut(p => ({ ...p, stop: v }))} />
              </>
            )}
          </div>

          {/* Take profit / R:R */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="label">Target</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button style={tog(tpMode === 'ratio')} onClick={() => setTpMode('ratio')}>R:R</button>
                <button style={tog(tpMode === 'price')} onClick={() => setTpMode('price')}>Price</button>
              </div>
            </div>

            {tpMode === 'ratio' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Preset pills */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {RR_PRESETS.map(r => {
                    const active = isForex ? fx.rrRatio === r : fut.rrRatio === r;
                    return (
                      <button key={r}
                        onClick={() => isForex ? setFx(p => ({ ...p, rrRatio: r })) : setFut(p => ({ ...p, rrRatio: r }))}
                        style={{
                          padding: '3px 9px', borderRadius: 5, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
                          background: active ? 'rgba(96,165,250,0.15)' : 'var(--raised)',
                          border: `1px solid ${active ? 'rgba(96,165,250,0.35)' : 'var(--border)'}`,
                          color: active ? 'var(--blue)' : 'var(--text-3)',
                          transition: 'all 100ms',
                        }}
                      >
                        1:{r}
                      </button>
                    );
                  })}
                </div>
                {/* Custom ratio */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Custom 1:</span>
                  <input type="number" className="input-field" step={0.1} min={0.1}
                    style={{ fontSize: '0.8125rem' }}
                    value={isForex ? fx.rrRatio : fut.rrRatio}
                    onChange={e => isForex
                      ? setFx(p => ({ ...p, rrRatio: Number(e.target.value) }))
                      : setFut(p => ({ ...p, rrRatio: Number(e.target.value) }))
                    }
                  />
                </div>
              </div>
            ) : (
              isForex
                ? <Field label="Take Profit Price" value={fx.tpPrice} step={0.0001} decimals={4}
                    onChange={v => setFx(p => ({ ...p, tpPrice: v }))} />
                : <Field label="Take Profit Price" value={fut.tpPrice} step={0.25}
                    onChange={v => setFut(p => ({ ...p, tpPrice: v }))} />
            )}
          </div>
        </div>

        {/* Vertical divider */}
        {!isMobile && <div style={{ width: 1, background: 'var(--border)', flexShrink: 0, alignSelf: 'stretch' }} />}

        {/* ── Results ── */}
        <div style={{ flex: isMobile ? 'none' : '0 0 172px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Direction badge */}
          <span style={{
            display: 'inline-flex', alignSelf: 'flex-start',
            padding: '3px 10px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700,
            background: isLong ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${isLong ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
            color: isLong ? 'var(--green)' : 'var(--red)',
          }}>
            {isLong ? '↑ Long' : '↓ Short'}
          </span>

          {/* Hero metric */}
          <div style={{
            background: 'var(--inset)', borderRadius: 8, border: '1px solid var(--border)',
            padding: '10px 14px',
          }}>
            <div style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 5 }}>
              {isForex ? 'Lot Size' : 'Contracts'}
            </div>
            <div style={{
              fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-1)',
              letterSpacing: '-0.03em', lineHeight: 1,
              fontFamily: "'JetBrains Mono','SF Mono',monospace",
              fontVariantNumeric: 'tabular-nums',
            }}>
              {isForex ? fc.lotSize.toFixed(2) : ft.contracts.toFixed(2)}
            </div>
          </div>

          {/* Risk / Reward side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div style={{
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)',
              borderRadius: 7, padding: '8px 10px',
            }}>
              <div style={{ fontSize: '0.57rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Risk</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--red)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                -${isForex
                  ? fc.risk.toLocaleString(undefined, { maximumFractionDigits: 0 })
                  : ft.risk.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div style={{
              background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)',
              borderRadius: 7, padding: '8px 10px',
            }}>
              <div style={{ fontSize: '0.57rem', fontWeight: 700, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Reward</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--green)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                +${isForex
                  ? fc.reward.toLocaleString(undefined, { maximumFractionDigits: 0 })
                  : ft.reward.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          {/* R:R pill */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 12px', background: 'var(--raised)', borderRadius: 7, border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>R : R</span>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              1 : {rrValue.toFixed(2)}
            </span>
          </div>

          {/* Secondary: TP + pip/point risk */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              {
                label: 'Take Profit',
                value: isForex ? tpValue.toFixed(4) : tpValue.toFixed(2),
                color: 'var(--blue)',
              },
              {
                label: isForex ? 'Pip Risk' : 'Point Risk',
                value: isForex ? `${fc.pips.toFixed(1)} pips` : `${ft.stopDist.toFixed(2)} pts`,
                color: 'var(--amber)',
              },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
