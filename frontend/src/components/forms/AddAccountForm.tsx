import { useState, useEffect, CSSProperties } from 'react';
import { SlideOver } from '../ui/SlideOver';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useStore } from '../../store';
import { useCreateAccount } from '../../hooks/useAccounts';
import { useFirms } from '../../hooks/useFirms';
import { Account, Stage } from '../../types/account';

interface StageFormData {
  name: string;
  profit_target: number;
  max_loss: number;
  max_daily_loss: number;
  min_trading_days: number;
  profit_split: number;
  on_demand_payout: boolean;
}

const defaultStages: StageFormData[] = [
  { name: 'Phase 1', profit_target: 10000, max_loss: 10000, max_daily_loss: 5000, min_trading_days: 4, profit_split: 80, on_demand_payout: false },
  { name: 'Phase 2', profit_target: 5000,  max_loss: 10000, max_daily_loss: 5000, min_trading_days: 4, profit_split: 80, on_demand_payout: false },
  { name: 'Live',    profit_target: 0,     max_loss: 10000, max_daily_loss: 5000, min_trading_days: 0, profit_split: 80, on_demand_payout: true  },
];

const leverageOptions = [
  { value: '1:10',  label: '1:10'  },
  { value: '1:30',  label: '1:30'  },
  { value: '1:50',  label: '1:50'  },
  { value: '1:100', label: '1:100' },
  { value: '1:200', label: '1:200' },
  { value: '1:500', label: '1:500' },
];

// ── Shared label style ─────────────────────────────────────────────────
const sectionLabel: CSSProperties = {
  fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)',
  textTransform: 'uppercase', letterSpacing: '0.08em',
};

export const AddAccountForm = () => {
  const { isAddAccountOpen, setAddAccountOpen, selectedFirmId } = useStore();
  const { data: firms } = useFirms();
  const createAccountMutation = useCreateAccount();

  const [formData, setFormData] = useState({
    firm_id:      selectedFirmId || '',
    plan_name:    '',
    account_size: 100000,
    fees:         0,
    start_date:   '',
    platform:     '',
    leverage:     '1:100',
  });

  const [stages, setStages] = useState<StageFormData[]>(defaultStages);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedFirmId) setFormData(prev => ({ ...prev, firm_id: selectedFirmId }));
  }, [selectedFirmId]);

  const firmOptions = [
    { value: '', label: 'Select Firm' },
    ...(firms?.map(f => ({ value: f.id, label: f.name })) ?? []),
  ];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.firm_id)          e.firm_id      = 'Please select a firm';
    if (!formData.plan_name.trim()) e.plan_name    = 'Plan name is required';
    if (formData.account_size <= 0) e.account_size = 'Account size must be > 0';
    if (stages.length === 0)        e.stages       = 'At least one stage is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleStageChange = (index: number, field: keyof StageFormData, value: any) => {
    setStages(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addStage = () => setStages(prev => [...prev, {
    name: `Stage ${prev.length + 1}`,
    profit_target: 0, max_loss: 0, max_daily_loss: 0,
    min_trading_days: 0, profit_split: 80, on_demand_payout: false,
  }]);

  const removeStage = (index: number) => {
    if (stages.length > 1) setStages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const accountStages: Stage[] = stages.map((s, i) => ({
      name:             s.name,
      status:           i === 0 ? 'in_progress' : ('pending' as const),
      profit_target:    Number(s.profit_target),
      max_loss:         Number(s.max_loss),
      max_daily_loss:   Number(s.max_daily_loss),
      min_trading_days: Number(s.min_trading_days),
      profit_split:     Number(s.profit_split),
      on_demand_payout: s.on_demand_payout,
      current_pnl:      0,
      daily_loss_used:  0,
      days_traded:      0,
      created_at:       new Date().toISOString(),
    }));

    const accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'> = {
      firm_id:      formData.firm_id,
      plan_name:    formData.plan_name.trim(),
      account_size: Number(formData.account_size),
      fees:         Number(formData.fees) || undefined,
      start_date:   formData.start_date || undefined,
      platform:     formData.platform,
      leverage:     formData.leverage,
      current_stage: 0,
      stages:       accountStages,
      notes:        '',
    };

    createAccountMutation.mutate(accountData, { onSuccess: handleClose });
  };

  const handleClose = () => {
    setFormData({ firm_id: '', plan_name: '', account_size: 100000, fees: 0, start_date: '', platform: '', leverage: '1:100' });
    setStages(defaultStages);
    setErrors({});
    setAddAccountOpen(false);
  };

  return (
    <SlideOver isOpen={isAddAccountOpen} onClose={handleClose} title="Add Account">
      <form id="add-account-form" onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 0 }}
      >
        {/* Firm */}
        <Select
          label="Prop Firm"
          value={formData.firm_id}
          onChange={e => setFormData(prev => ({ ...prev, firm_id: e.target.value }))}
          options={firmOptions}
          error={errors.firm_id}
        />

        {/* Plan name */}
        <Input
          label="Plan Name"
          value={formData.plan_name}
          onChange={e => setFormData(prev => ({ ...prev, plan_name: e.target.value }))}
          placeholder="e.g., FTMO Standard"
          error={errors.plan_name}
        />

        {/* Account size + fees */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input
            label="Account Size ($)"
            type="number"
            value={formData.account_size}
            onChange={e => setFormData(prev => ({ ...prev, account_size: Number(e.target.value) }))}
            placeholder="100000"
            error={errors.account_size}
          />
          <Input
            label="Fees ($)"
            type="number"
            min="0"
            step="0.01"
            value={formData.fees || ''}
            onChange={e => setFormData(prev => ({ ...prev, fees: Number(e.target.value) }))}
            placeholder="e.g., 150"
          />
        </div>

        {/* Start date */}
        <Input
          label="Start Date"
          type="date"
          value={formData.start_date}
          onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
        />

        {/* Platform + leverage */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input
            label="Platform"
            value={formData.platform}
            onChange={e => setFormData(prev => ({ ...prev, platform: e.target.value }))}
            placeholder="MT4, MT5…"
          />
          <Select
            label="Leverage"
            value={formData.leverage}
            onChange={e => setFormData(prev => ({ ...prev, leverage: e.target.value }))}
            options={leverageOptions}
          />
        </div>

        {/* Stages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={sectionLabel}>Stages</span>
            <button
              type="button"
              onClick={addStage}
              style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: 5,
                color: 'var(--text-2)', fontSize: '0.72rem', fontWeight: 600,
                padding: '3px 10px', cursor: 'pointer',
              }}
            >
              + Add Stage
            </button>
          </div>

          {errors.stages && (
            <span style={{ fontSize: '0.7rem', color: 'var(--red)' }}>{errors.stages}</span>
          )}

          {stages.map((stage, index) => (
            <div
              key={index}
              style={{
                background: 'var(--raised)', border: '1px solid var(--border)',
                borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 12,
              }}
            >
              {/* Stage header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  value={stage.name}
                  onChange={e => handleStageChange(index, 'name', e.target.value)}
                  style={{
                    flex: 1, padding: '6px 8px', background: 'var(--inset)',
                    border: '1px solid var(--border)', borderRadius: 5,
                    color: 'var(--text-1)', fontSize: '0.8125rem', outline: 'none',
                    fontWeight: 600,
                  }}
                />
                {stages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStage(index)}
                    style={{
                      background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                      color: '#ef4444', borderRadius: 5, padding: '4px 10px',
                      fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Stage fields grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Input
                  label="Profit Target"
                  type="number"
                  value={stage.profit_target}
                  onChange={e => handleStageChange(index, 'profit_target', Number(e.target.value))}
                />
                <Input
                  label="Max Loss"
                  type="number"
                  value={stage.max_loss}
                  onChange={e => handleStageChange(index, 'max_loss', Number(e.target.value))}
                />
                <Input
                  label="Max Daily Loss"
                  type="number"
                  value={stage.max_daily_loss}
                  onChange={e => handleStageChange(index, 'max_daily_loss', Number(e.target.value))}
                />
                <Input
                  label="Min Trading Days"
                  type="number"
                  value={stage.min_trading_days}
                  onChange={e => handleStageChange(index, 'min_trading_days', Number(e.target.value))}
                />
                <Input
                  label="Profit Split (%)"
                  type="number"
                  min="0"
                  max="100"
                  value={stage.profit_split}
                  onChange={e => handleStageChange(index, 'profit_split', Number(e.target.value))}
                />
                <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={stage.on_demand_payout}
                      onChange={e => handleStageChange(index, 'on_demand_payout', e.target.checked)}
                      style={{ width: 15, height: 15, accentColor: 'var(--blue)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>On-Demand Payout</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sticky action footer */}
        <div style={{
          position: 'sticky', bottom: 0,
          marginLeft: -20, marginRight: -20,
          padding: '14px 20px 20px',
          background: 'linear-gradient(to bottom, transparent 0%, var(--surface) 28%)',
          display: 'flex', gap: 10,
        }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 7, cursor: 'pointer',
              background: 'var(--raised)', border: '1px solid var(--border)',
              color: 'var(--text-2)', fontSize: '0.8125rem', fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createAccountMutation.isPending}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 7, cursor: createAccountMutation.isPending ? 'not-allowed' : 'pointer',
              background: 'var(--blue)', border: 'none',
              color: '#fff', fontSize: '0.8125rem', fontWeight: 700,
              opacity: createAccountMutation.isPending ? 0.7 : 1,
            }}
          >
            {createAccountMutation.isPending ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      </form>
    </SlideOver>
  );
};
