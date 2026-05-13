import { useState } from 'react';
import { SlideOver } from '../ui/SlideOver';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useStore } from '../../store';
import { useCreateFirm } from '../../hooks/useFirms';
import { PropFirm } from '../../types/firm';

export const AddFirmForm = () => {
  const { isAddFirmOpen, setAddFirmOpen, activeSection } = useStore();
  const createFirmMutation = useCreateFirm();
  
  const [formData, setFormData] = useState({
    name: '',
    platform: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const platformOptions = activeSection === 'forex' 
    ? [
        { value: '', label: 'Select Platform' },
        { value: 'MT4', label: 'MetaTrader 4' },
        { value: 'MT5', label: 'MetaTrader 5' },
        { value: 'cTrader', label: 'cTrader' },
        { value: 'DXTrade', label: 'DXTrade' },
      ]
    : [
        { value: '', label: 'Select Platform' },
        { value: 'Rithmic', label: 'Rithmic' },
        { value: 'CQG', label: 'CQG' },
        { value: 'TradingTech', label: 'TradingTech' },
        { value: 'MT5', label: 'MetaTrader 5' },
        { value: 'NinjaTrader', label: 'NinjaTrader' },
      ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Firm name is required';
    }
    
    if (!formData.platform) {
      newErrors.platform = 'Platform is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const firmData: Omit<PropFirm, 'id' | 'created_at' | 'updated_at'> = {
      name: formData.name.trim(),
      market_type: activeSection,
      platform: formData.platform,
      notes: formData.notes.trim(),
    };

    createFirmMutation.mutate(firmData, {
      onSuccess: () => {
        setFormData({ name: '', platform: '', notes: '' });
        setErrors({});
        setAddFirmOpen(false);
      },
    });
  };

  const handleClose = () => {
    setFormData({ name: '', platform: '', notes: '' });
    setErrors({});
    setAddFirmOpen(false);
  };

  return (
    <SlideOver
      isOpen={isAddFirmOpen}
      onClose={handleClose}
      title="Add Prop Firm"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Firm Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter firm name (e.g., FTMO, Apex Trader)"
          error={errors.name}
        />

        <div>
          <label className="section-header block mb-2">Market Type</label>
          <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
            <span className="text-white text-sm font-medium">
              {activeSection === 'forex' ? 'Forex' : 'US Futures'}
            </span>
            <p className="text-gray-400 text-xs mt-1">
              Locked to active section
            </p>
          </div>
        </div>

        <Select
          label="Trading Platform"
          value={formData.platform}
          onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
          options={platformOptions}
          error={errors.platform}
        />

        <div>
          <label className="section-header block mb-2">Notes (Optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any notes about this firm..."
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={createFirmMutation.isPending}
          >
            {createFirmMutation.isPending ? 'Creating...' : 'Create Firm'}
          </Button>
        </div>
      </form>
    </SlideOver>
  );
};