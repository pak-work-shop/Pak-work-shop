import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Calculator, Save, RefreshCw, Car, Truck, Info, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { TranslatableField } from '../../components/common/TranslatableField';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import type { EstimatorRuleRow, LocalizedText, VehicleClass } from '../../types/database';

const DEFAULT_RULES: Array<{
  vehicle_class: VehicleClass;
  label: LocalizedText;
  multiplier: number;
  sort_order: number;
}> = [
  {
    vehicle_class: 'hatchback',
    label: {
      en: 'Hatchback (Small / Kei Car)',
      ur: 'ہیچ بیک (چھوٹی کار)',
      'ur-roman': 'Hatchback (Chhoti Gaari)',
    },
    multiplier: 0.9,
    sort_order: 1,
  },
  {
    vehicle_class: 'sedan',
    label: {
      en: 'Sedan (Standard 4-Door)',
      ur: 'سیڈان (معیاری کار)',
      'ur-roman': 'Sedan (Standard Gaari)',
    },
    multiplier: 1.0,
    sort_order: 2,
  },
  {
    vehicle_class: 'suv',
    label: {
      en: 'SUV / Crossover (4x4)',
      ur: 'ایس یو وی / کراس اوور',
      'ur-roman': 'SUV / Crossover (4x4)',
    },
    multiplier: 1.3,
    sort_order: 3,
  },
  {
    vehicle_class: 'pickup',
    label: {
      en: 'Pickup / Commercial',
      ur: 'پک اپ / کمرشل',
      'ur-roman': 'Pickup / Commercial (4x4)',
    },
    multiplier: 1.35,
    sort_order: 4,
  },
  {
    vehicle_class: 'van',
    label: {
      en: 'Van / MPV / Minivan',
      ur: 'وین / ایم پی وی',
      'ur-roman': 'Van / Minivan / MPV',
    },
    multiplier: 1.25,
    sort_order: 5,
  },
];

export default function EstimatorAdminPage() {
  const { t } = useTranslation();

  const [rules, setRules] = useState<EstimatorRuleRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);

  const fetchRules = async () => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('estimator_rules')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setRules(data);
      } else {
        // Fallback default rules
        setRules(
          DEFAULT_RULES.map((dr, idx) => ({
            id: `temp-${idx}`,
            vehicle_class: dr.vehicle_class,
            label: dr.label,
            multiplier: dr.multiplier,
            sort_order: dr.sort_order,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load estimator rules:', err);
      toast.error('Failed to load estimator rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRules();
  }, []);

  const handleUpdateMultiplier = (index: number, val: number) => {
    setRules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], multiplier: val };
      return next;
    });
  };

  const handleUpdateLabel = (index: number, label: LocalizedText) => {
    setRules((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], label };
      return next;
    });
  };

  const handleSaveRule = async (rule: EstimatorRuleRow, index: number) => {
    if (rule.multiplier < 0.5 || rule.multiplier > 5.0) {
      toast.error('Multiplier must be between 0.50 and 5.00');
      return;
    }

    setSavingIndex(index);
    try {
      const payload = {
        vehicle_class: rule.vehicle_class,
        label: rule.label,
        multiplier: rule.multiplier,
        sort_order: rule.sort_order,
      };

      const { error } = await supabase
        .from('estimator_rules')
        .upsert(payload, { onConflict: 'vehicle_class' });

      if (error) throw error;
      toast.success(`${rule.vehicle_class.toUpperCase()} multiplier saved!`);
      void fetchRules();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save estimator rule');
    } finally {
      setSavingIndex(null);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('Reset all vehicle class multipliers to standard workshop baselines?')) return;
    setLoading(true);
    try {
      for (const def of DEFAULT_RULES) {
        await supabase.from('estimator_rules').upsert(def, { onConflict: 'vehicle_class' });
      }
      toast.success('Estimator rules reset to defaults');
      void fetchRules();
    } catch (err) {
      console.error(err);
      toast.error('Failed to reset defaults');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
            <Calculator className="w-6 h-6 text-[#FF6A00]" />
            <span>{t('admin.estimator.title', 'Cost Estimator Rules & Multipliers')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#8A93A3]">
            {t(
              'admin.estimator.subtitle',
              'Configure price multipliers for vehicle classes. Base service rates are multiplied by these factors in the public cost calculator.'
            )}
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleResetDefaults}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Reset Defaults
        </Button>
      </div>

      {/* Info Notice */}
      <div className="p-4 rounded-xl bg-[#1B1F26] border border-white/10 flex items-start gap-3 text-xs text-[#8A93A3]">
        <Info className="w-4 h-4 text-[#FF6A00] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-white font-medium">How the Cost Calculation Works:</p>
          <p>
            When a visitor selects a <strong>Sedan (multiplier 1.00)</strong>, the base service prices are used directly.
            If they select an <strong>SUV (multiplier 1.30)</strong>, all service estimates increase by 30% to account for larger oil capacity, heavier brake hardware, and increased labor time.
          </p>
        </div>
      </div>

      {/* Rules List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule, idx) => (
            <div
              key={rule.vehicle_class}
              className="bg-[#1B1F26] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-white/20 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#12151A] border border-white/10 text-[#FF6A00]">
                    {rule.vehicle_class === 'pickup' || rule.vehicle_class === 'van' ? (
                      <Truck className="w-5 h-5" />
                    ) : (
                      <Car className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base uppercase tracking-wider">
                      {rule.vehicle_class}
                    </h3>
                    <span className="text-xs text-[#8A93A3]">
                      Sort order: {rule.sort_order}
                    </span>
                  </div>
                </div>

                {/* Multiplier Slider & Input */}
                <div className="flex items-center gap-3 bg-[#12151A] p-2 rounded-xl border border-white/10">
                  <label className="text-xs text-[#8A93A3] whitespace-nowrap">
                    Multiplier:
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.05"
                    value={rule.multiplier}
                    onChange={(e) => handleUpdateMultiplier(idx, Number(e.target.value))}
                    className="w-24 sm:w-36 accent-[#FF6A00]"
                  />
                  <input
                    type="number"
                    min="0.5"
                    max="5.0"
                    step="0.05"
                    value={rule.multiplier}
                    onChange={(e) => handleUpdateMultiplier(idx, Number(e.target.value))}
                    className="w-16 bg-[#1B1F26] border border-white/10 rounded px-2 py-1 text-xs text-white font-mono text-center focus:outline-none focus:border-[#FF6A00]"
                  />
                  <span className="text-xs font-bold text-[#FFC21A]">
                    {rule.multiplier >= 1.0
                      ? `+${Math.round((rule.multiplier - 1.0) * 100)}%`
                      : `-${Math.round((1.0 - rule.multiplier) * 100)}%`}
                  </span>
                </div>
              </div>

              {/* Localized Label */}
              <div className="pt-2">
                <TranslatableField
                  label="Display Label"
                  value={rule.label}
                  onChange={(lbl) => handleUpdateLabel(idx, lbl)}
                  requiredEn
                />
              </div>

              {/* Save Button */}
              <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSaveRule(rule, idx)}
                  isLoading={savingIndex === idx}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  Save {rule.vehicle_class.toUpperCase()} Rule
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
