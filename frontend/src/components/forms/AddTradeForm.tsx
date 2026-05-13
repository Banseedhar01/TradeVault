import { useState, useEffect, CSSProperties } from 'react';
import { SlideOver } from '../ui/SlideOver';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useStore } from '../../store';
import { useCreateTrade } from '../../hooks/useTrades';
import { useAccounts } from '../../hooks/useAccounts';
import { useFirms } from '../../hooks/useFirms';
import { Trade } from '../../types/trade';

// Returns today's date in YYYY-MM-DD format using IST timezone
const todayIST = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

const sectionLabel: CSSProperties = {
  fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)',
  textTransform: 'uppercase', letterSpacing: '0.08em',
};

const FOREX_INSTRUMENTS = [
  { value: '', label: 'Select Instrument' },
  { value: 'EURUSD', label: 'EUR/USD' }, { value: 'GBPUSD', label: 'GBP/USD' },
  { value: 'USDJPY', label: 'USD/JPY' }, { value: 'AUDUSD', label: 'AUD/USD' },
  { value: 'USDCAD', label: 'USD/CAD' }, { value: 'EURJPY', label: 'EUR/JPY' },
  { value: 'GBPJPY', label: 'GBP/JPY' }, { value: 'EURGBP', label: 'EUR/GBP' },
];

const FUTURES_INSTRUMENTS = [
  { value: '', label: 'Select Instrument' },
  { value: 'NQ',  label: 'NQ (Nasdaq 100)'  }, { value: 'ES',  label: 'ES (S&P 500)'      },
  { value: 'MNQ', label: 'MNQ (Micro Nasdaq)'}, { value: 'MES', label: 'MES (Micro S&P)'   },
  { value: 'YM',  label: 'YM (Dow Jones)'   }, { value: 'RTY', label: 'RTY (Russell 2000)' },
  { value: 'CL',  label: 'CL (Crude Oil)'   }, { value: 'GC',  label: 'GC (Gold)'          },
];

const POINT_VALUES: Record<string, number> = {
  NQ: 20, ES: 50, MNQ: 2, MES: 5, YM: 5, RTY: 50, CL: 1000, GC: 100,
};

const blankForm = () => ({
  account_id: '', stage_id: 0,
  date: todayIST(),
  instrument: '', direction: 'long' as 'long' | 'short',
  entry_price: 0, stop_loss: 0, take_profit: 0,
  size: 1, exit_price: 0, notes: '',
});

export const AddTradeForm = () => {
  const { isAddTradeOpen, setAddTradeOpen, activeSection } = useStore();
  const { data: accounts } = useAccounts();
  const { data: firms }    = useFirms();
  const createTradeMutation = useCreateTrade();

  const [form, setForm]     = useState(blankForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Refresh date each time the form opens
  useEffect(() => {
    if (isAddTradeOpen) setForm(prev => ({ ...prev, date: todayIST() }));
  }, [isAddTradeOpen]);

  const sectionAccounts = (accounts || []).filter(a =>
    firms?.find(f => f.id === a.firm_id)?.market_type === activeSection
  );

  const accountOptions = [
    { value: '', label: 'Select Account' },
    ...sectionAccounts.map(a => ({
      value: a.id,
      label: `${firms?.find(f => f.id === a.firm_id)?.name} — ${a.plan_name}`,
    })),
  ];

  const selectedAccount = sectionAccounts.find(a => a.id === form.account_id);

  const stageOptions = (selectedAccount?.stages || []).map((s, i) => ({
    value: i.toString(), label: s.name,
  }));

  useEffect(() => {
    if (selectedAccount)
      setForm(prev => ({ ...prev, stage_id: selectedAccount.current_stage }));
  }, [selectedAccount?.id]);

  const instruments = activeSection === 'forex' ? FOREX_INSTRUMENTS : FUTURES_INSTRUMENTS;

  const calcPnl = () => {
    if (!form.exit_price || !form.entry_price || !form.size) return 0;
    const diff = form.direction === 'long'
      ? form.exit_price - form.entry_price
      : form.entry_price - form.exit_price;
    if (activeSection === 'forex') return diff * 10000 * 10 * form.size;
    return diff * (POINT_VALUES[form.instrument] || 20) * form.size;
  };

  const pnl = calcPnl();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.account_id)   e.account_id   = 'Select an account';
    if (!form.instrument)   e.instrument   = 'Select an instrument';
    if (form.entry_price <= 0) e.entry_price = 'Entry price must be > 0';
    if (form.size <= 0)     e.size         = 'Size must be > 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const trade: Omit<Trade, 'id' | 'created_at' | 'updated_at'> = {
      account_id:  form.account_id,
      stage_id:    Number(form.stage_id),
      date:        form.date,
      instrument:  form.instrument,
      direction:   form.direction,
      entry_price: Number(form.entry_price),
      stop_loss:   form.stop_loss   > 0 ? Number(form.stop_loss)   : undefined,
      take_profit: form.take_profit > 0 ? Number(form.take_profit) : undefined,
      size:        Number(form.size),
      exit_price:  form.exit_price  > 0 ? Number(form.exit_price)  : undefined,
      pnl:         form.exit_price  > 0 ? pnl : 0,
      status:      form.exit_price  > 0 ? 'closed' : 'open',
      notes:       form.notes.trim(),
    };

    createTradeMutation.mutate(trade, { onSuccess: handleClose });
  };

  const handleClose = () => {
    setForm(blankForm());
    setErrors({});
    setAddTradeOpen(false);
  };

  const set = (field: string, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <SlideOver isOpen={isAddTradeOpen} onClose={handleClose} title="Add Trade">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Date */}
        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={e => set('date', e.target.value)}
        />

        {/* Account */}
        <Select
          label="Account"
          value={form.account_id}
          onChange={e => set('account_id', e.target.value)}
          options={accountOptions}
          error={errors.account_id}
        />

        {/* Stage */}
        {selectedAccount && stageOptions.length > 0 && (
          <Select
            label="Stage"
            value={form.stage_id.toString()}
            onChange={e => set('stage_id', Number(e.target.value))}
            options={stageOptions}
          />
        )}

        {/* Instrument + Direction */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select
            label="Instrument"
            value={form.instrument}
            onChange={e => set('instrument', e.target.value)}
            options={instruments}
            error={errors.instrument}
          />
          <Select
            label="Direction"
            value={form.direction}
            onChange={e => set('direction', e.target.value as 'long' | 'short')}
            options={[{ value: 'long', label: '↑ Long' }, { value: 'short', label: '↓ Short' }]}
          />
        </div>

        {/* Entry + Size */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input
            label="Entry Price"
            type="number" step="0.0001"
            value={form.entry_price || ''}
            onChange={e => set('entry_price', Number(e.target.value))}
            placeholder="1.0950"
            error={errors.entry_price}
          />
          <Input
            label={activeSection === 'forex' ? 'Lot Size' : 'Contracts'}
            type="number" step="0.01"
            value={form.size || ''}
            onChange={e => set('size', Number(e.target.value))}
            placeholder={activeSection === 'forex' ? '0.10' : '1'}
            error={errors.size}
          />
        </div>

        {/* SL + TP */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input
            label="Stop Loss"
            type="number" step="0.0001"
            value={form.stop_loss || ''}
            onChange={e => set('stop_loss', Number(e.target.value))}
            placeholder="Optional"
          />
          <Input
            label="Take Profit"
            type="number" step="0.0001"
            value={form.take_profit || ''}
            onChange={e => set('take_profit', Number(e.target.value))}
            placeholder="Optional"
          />
        </div>

        {/* Exit price */}
        <Input
          label="Exit Price"
          type="number" step="0.0001"
          value={form.exit_price || ''}
          onChange={e => set('exit_price', Number(e.target.value))}
          placeholder="Leave empty for open trade"
        />

        {/* PnL preview */}
        {form.exit_price > 0 && (
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: pnl >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${pnl >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={sectionLabel}>Calculated PnL</span>
            <span style={{
              fontSize: '1rem', fontWeight: 700,
              color: pnl >= 0 ? 'var(--green)' : 'var(--red)',
            }}>
              {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
            </span>
          </div>
        )}

        {/* Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={sectionLabel}>Notes (Optional)</span>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Trade notes, strategy, observations…"
            rows={3}
            style={{
              padding: '8px 12px', borderRadius: 7, resize: 'vertical',
              background: 'var(--inset)', border: '1px solid var(--border)',
              color: 'var(--text-1)', fontSize: '0.8125rem', outline: 'none',
              fontFamily: 'inherit', lineHeight: 1.5,
            }}
          />
        </div>

        {/* Sticky footer */}
        <div style={{
          position: 'sticky', bottom: 0,
          marginLeft: -20, marginRight: -20,
          padding: '14px 20px 20px',
          background: 'linear-gradient(to bottom, transparent 0%, var(--surface) 28%)',
          display: 'flex', gap: 10,
        }}>
          <button type="button" onClick={handleClose} style={{
            flex: 1, padding: '9px 0', borderRadius: 7, cursor: 'pointer',
            background: 'var(--raised)', border: '1px solid var(--border)',
            color: 'var(--text-2)', fontSize: '0.8125rem', fontWeight: 600,
          }}>
            Cancel
          </button>
          <button type="submit" disabled={createTradeMutation.isPending} style={{
            flex: 1, padding: '9px 0', borderRadius: 7,
            cursor: createTradeMutation.isPending ? 'not-allowed' : 'pointer',
            background: 'var(--blue)', border: 'none',
            color: '#fff', fontSize: '0.8125rem', fontWeight: 700,
            opacity: createTradeMutation.isPending ? 0.7 : 1,
          }}>
            {createTradeMutation.isPending ? 'Creating…' : 'Add Trade'}
          </button>
        </div>

      </form>
    </SlideOver>
  );
};
