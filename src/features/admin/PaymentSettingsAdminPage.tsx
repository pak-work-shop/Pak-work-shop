import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Copy,
  Plus,
  RefreshCw,
  Save,
  ShieldAlert,
  Sliders,
  Trash2,
  Wallet,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { pickLocalized } from '../../lib/format';
import type { LanguageCode } from '../../types/i18n';
import type { PaymentAccountRow, PaymentMethodType, PaymentSettingsRow } from '../../types/database';

export function PaymentSettingsAdminPage() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'en') as LanguageCode;

  const [settings, setSettings] = useState<PaymentSettingsRow | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<PaymentAccountRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  // Modal for new/edit account
  const [editingAccount, setEditingAccount] = useState<Partial<PaymentAccountRow> | null>(null);
  const [accountModalOpen, setAccountModalOpen] = useState<boolean>(false);
  const [savingAccount, setSavingAccount] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [setRes, siteRes, accRes] = await Promise.all([
        supabase.from('payment_settings').select('*').eq('id', 1).maybeSingle(),
        supabase.from('site_settings').select('demo_mode').eq('id', 1).maybeSingle(),
        supabase.from('payment_accounts').select('*').order('sort_order', { ascending: true }),
      ]);

      if (setRes.data) {
        setSettings(setRes.data as PaymentSettingsRow);
      }
      setIsDemoMode(Boolean(siteRes.data?.demo_mode));
      if (accRes.data) {
        setAccounts((accRes.data as unknown as PaymentAccountRow[]) || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);

    try {
      const { error } = await supabase
        .from('payment_settings')
        .update({
          manual_enabled: settings.manual_enabled,
          mock_gateway_enabled: settings.mock_gateway_enabled,
          require_proof: settings.require_proof,
        })
        .eq('id', 1);

      if (error) throw error;
      toast.success('Payment settings updated successfully');
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleAccount = async (account: PaymentAccountRow) => {
    try {
      const { error } = await supabase
        .from('payment_accounts')
        .update({ is_active: !account.is_active })
        .eq('id', account.id);

      if (error) throw error;
      toast.success(`Account ${account.is_active ? 'deactivated' : 'activated'}`);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error toggling account');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this payment account?')) return;
    try {
      const { error } = await supabase.from('payment_accounts').delete().eq('id', id);
      if (error) throw error;
      toast.success('Account deleted');
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error deleting account');
    }
  };

  const handleSaveAccountModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    if (!editingAccount.account_title?.trim() || !editingAccount.account_number?.trim()) {
      toast.error('Account title and number are required');
      return;
    }

    setSavingAccount(true);

    try {
      const payload = {
        method: editingAccount.method || 'bank_transfer',
        title: editingAccount.title || { en: '', ur: '', 'ur-roman': '' },
        account_title: editingAccount.account_title.trim(),
        account_number: editingAccount.account_number.trim(),
        iban: editingAccount.iban?.trim() || null,
        bank_name: editingAccount.bank_name?.trim() || null,
        instructions: editingAccount.instructions || { en: '', ur: '', 'ur-roman': '' },
        sort_order: Number(editingAccount.sort_order ?? 0),
        is_active: editingAccount.is_active ?? true,
      };

      if (editingAccount.id) {
        const { error } = await supabase
          .from('payment_accounts')
          .update(payload)
          .eq('id', editingAccount.id);
        if (error) throw error;
        toast.success('Account updated successfully');
      } else {
        const { error } = await supabase.from('payment_accounts').insert(payload);
        if (error) throw error;
        toast.success('New payment account added');
      }

      setAccountModalOpen(false);
      setEditingAccount(null);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save account');
    } finally {
      setSavingAccount(false);
    }
  };

  const copyEnvVar = (name: string) => {
    void navigator.clipboard.writeText(name);
    toast.success(`Copied secret name: ${name}`);
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <Spinner size="lg" label="Loading payment configuration..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-black font-heading text-white flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-[#FF6A00]" />
            <span>Payment Settings & Accounts</span>
          </h1>
          <p className="text-xs text-[#8A93A3] mt-0.5">
            Manage store payment switches, workshop receiving accounts, and review gateway readiness
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void loadData()}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>

      {/* Global Toggles Card */}
      {settings && (
        <Card className="p-6 bg-[#16191E] border-white/10 space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#FF6A00]" />
              <span>Checkout Payment Switches</span>
            </h2>

            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={savingSettings}
              onClick={handleSaveSettings}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Manual Payments Switch */}
            <div className="bg-[#0E1013] p-4 rounded-lg border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">Manual Online Payments</span>
                <input
                  type="checkbox"
                  checked={settings.manual_enabled}
                  onChange={(e) =>
                    setSettings({ ...settings, manual_enabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#FF6A00] rounded cursor-pointer"
                />
              </div>
              <p className="text-xs text-[#8A93A3]">
                Enables Bank Transfer, JazzCash & Easypaisa accounts at checkout. Customers submit payment proof.
              </p>
            </div>

            {/* 2. Demo Mock Gateway Switch */}
            <div className="bg-[#0E1013] p-4 rounded-lg border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white">Demo Mock Gateway</span>
                  <Badge variant="warning">DEMO</Badge>
                </div>
                <input
                  type="checkbox"
                  disabled={!isDemoMode}
                  checked={settings.mock_gateway_enabled && isDemoMode}
                  onChange={(e) =>
                    setSettings({ ...settings, mock_gateway_enabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#FF6A00] rounded cursor-pointer disabled:opacity-40"
                />
              </div>
              <p className="text-xs text-[#8A93A3]">
                Simulates a hosted card payment page (/pay/mock/:token).
                {!isDemoMode && (
                  <span className="text-amber-400 block pt-1 font-semibold">
                    Disabled because site demo mode is currently OFF.
                  </span>
                )}
              </p>
            </div>

            {/* 3. Require Proof Switch */}
            <div className="bg-[#0E1013] p-4 rounded-lg border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-white">Require Screenshot Proof</span>
                <input
                  type="checkbox"
                  checked={settings.require_proof}
                  onChange={(e) =>
                    setSettings({ ...settings, require_proof: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#FF6A00] rounded cursor-pointer"
                />
              </div>
              <p className="text-xs text-[#8A93A3]">
                When enabled, customers must attach a valid receipt image/PDF with their transaction ID.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Payment Receiving Accounts CRUD */}
      <Card className="p-6 bg-[#16191E] border-white/10 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#FF6A00]" />
              <span>Workshop Receiving Accounts</span>
            </h2>
            <p className="text-xs text-[#8A93A3]">
              Active accounts are presented to customers during checkout and on their order confirmation screen.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingAccount({
                method: 'bank_transfer',
                account_title: 'Pak Auto Works & Parts',
                account_number: '',
                is_active: true,
                sort_order: accounts.length + 1,
                title: { en: '', ur: '', 'ur-roman': '' },
                instructions: { en: '', ur: '', 'ur-roman': '' },
              });
              setAccountModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Payment Account
          </Button>
        </div>

        {accounts.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8A93A3]">
            No payment accounts configured. Click &quot;Add Payment Account&quot; to add your bank or wallet.
          </div>
        ) : (
          <div className="divide-y divide-white/10 border border-white/10 rounded-lg overflow-hidden bg-[#0E1013]">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-white/5 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">
                      {pickLocalized(acc.title, lang) || acc.bank_name || acc.account_title}
                    </span>
                    <Badge variant={acc.is_active ? 'success' : 'neutral'}>
                      {acc.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-[11px] uppercase font-mono text-[#8A93A3]">
                      ({acc.method})
                    </span>
                    {acc.is_demo && <Badge variant="warning">DEMO</Badge>}
                  </div>

                  <p className="text-xs text-[#8A93A3]">
                    Title: <strong className="text-white">{acc.account_title}</strong> • Number:{' '}
                    <strong className="text-white font-mono" dir="ltr">{acc.account_number}</strong>
                    {acc.iban && (
                      <span> • IBAN: <strong className="text-white font-mono" dir="ltr">{acc.iban}</strong></span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleToggleAccount(acc)}
                  >
                    {acc.is_active ? 'Deactivate' : 'Activate'}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingAccount({ ...acc });
                      setAccountModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleDeleteAccount(acc.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Read-Only Gateway Readiness Section */}
      <Card className="p-6 bg-[#16191E] border-white/10 space-y-4">
        <div className="border-b border-white/10 pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-400" />
              <span>Automated Gateway Readiness (Scaffolded Adapters)</span>
            </h2>
            <Badge variant="neutral">Phase 7 Scaffolding</Badge>
          </div>
          <p className="text-xs text-[#8A93A3] mt-1">
            Edge function adapters are coded under <code>supabase/functions/</code>. When merchant credentials are provided, enter the secrets below to activate live automated callbacks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* JazzCash */}
          <div className="bg-[#0E1013] p-4 rounded-lg border border-white/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-white">JazzCash Pakistan</span>
              <Badge variant="neutral">Not Configured</Badge>
            </div>
            <p className="text-xs text-[#8A93A3]">
              Required Supabase Secrets:
            </p>
            <div className="space-y-1 font-mono text-[11px] text-amber-300 bg-black/40 p-2 rounded">
              {['JAZZCASH_MERCHANT_ID', 'JAZZCASH_PASSWORD', 'JAZZCASH_INTEGERITY_SALT'].map((v) => (
                <div key={v} className="flex justify-between items-center">
                  <span>{v}</span>
                  <button type="button" onClick={() => copyEnvVar(v)} className="text-[#8A93A3] hover:text-white">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Easypaisa */}
          <div className="bg-[#0E1013] p-4 rounded-lg border border-white/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-white">Easypaisa (Telenor)</span>
              <Badge variant="neutral">Not Configured</Badge>
            </div>
            <p className="text-xs text-[#8A93A3]">
              Required Supabase Secrets:
            </p>
            <div className="space-y-1 font-mono text-[11px] text-amber-300 bg-black/40 p-2 rounded">
              {['EASYPAISA_STORE_ID', 'EASYPAISA_HASH_KEY', 'EASYPAISA_POST_URL'].map((v) => (
                <div key={v} className="flex justify-between items-center">
                  <span>{v}</span>
                  <button type="button" onClick={() => copyEnvVar(v)} className="text-[#8A93A3] hover:text-white">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* PayFast */}
          <div className="bg-[#0E1013] p-4 rounded-lg border border-white/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-white">PayFast (APPS)</span>
              <Badge variant="neutral">Not Configured</Badge>
            </div>
            <p className="text-xs text-[#8A93A3]">
              Required Supabase Secrets:
            </p>
            <div className="space-y-1 font-mono text-[11px] text-amber-300 bg-black/40 p-2 rounded">
              {['PAYFAST_MERCHANT_ID', 'PAYFAST_SECURED_KEY'].map((v) => (
                <div key={v} className="flex justify-between items-center">
                  <span>{v}</span>
                  <button type="button" onClick={() => copyEnvVar(v)} className="text-[#8A93A3] hover:text-white">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Safepay */}
          <div className="bg-[#0E1013] p-4 rounded-lg border border-white/10 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-white">Safepay Pakistan</span>
              <Badge variant="neutral">Not Configured</Badge>
            </div>
            <p className="text-xs text-[#8A93A3]">
              Required Supabase Secrets:
            </p>
            <div className="space-y-1 font-mono text-[11px] text-amber-300 bg-black/40 p-2 rounded">
              {['SAFEPAY_API_KEY', 'SAFEPAY_SHARED_SECRET'].map((v) => (
                <div key={v} className="flex justify-between items-center">
                  <span>{v}</span>
                  <button type="button" onClick={() => copyEnvVar(v)} className="text-[#8A93A3] hover:text-white">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Account Edit/Create Modal */}
      {accountModalOpen && editingAccount && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-[#16191E] border-white/10 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#FF6A00]" />
              <span>{editingAccount.id ? 'Edit Payment Account' : 'Add Payment Account'}</span>
            </h3>

            <form onSubmit={handleSaveAccountModal} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8A93A3] mb-1 font-semibold">Payment Channel *</label>
                <select
                  value={editingAccount.method || 'bank_transfer'}
                  onChange={(e) =>
                    setEditingAccount({
                      ...editingAccount,
                      method: e.target.value as PaymentMethodType,
                    })
                  }
                  className="w-full bg-[#0E1013] border border-white/15 rounded-md px-3 py-2 text-white"
                >
                  <option value="bank_transfer">Bank Transfer (Commercial Bank / IBAN)</option>
                  <option value="jazzcash">JazzCash Mobile Account</option>
                  <option value="easypaisa">Easypaisa Wallet</option>
                  <option value="other">Other Digital Account</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Account Title *"
                  value={editingAccount.account_title || ''}
                  onChange={(e) =>
                    setEditingAccount({ ...editingAccount, account_title: e.target.value })
                  }
                  placeholder="e.g. Pak Auto Works"
                  required
                />
                <Input
                  label="Account Number / Phone *"
                  dir="ltr"
                  value={editingAccount.account_number || ''}
                  onChange={(e) =>
                    setEditingAccount({ ...editingAccount, account_number: e.target.value })
                  }
                  placeholder="e.g. 010101010101 or 03001234567"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Bank Name (Optional)"
                  value={editingAccount.bank_name || ''}
                  onChange={(e) =>
                    setEditingAccount({ ...editingAccount, bank_name: e.target.value })
                  }
                  placeholder="e.g. Commercial Bank (Sadiqabad Branch)"
                />
                <Input
                  label="IBAN (Optional)"
                  dir="ltr"
                  value={editingAccount.iban || ''}
                  onChange={(e) =>
                    setEditingAccount({ ...editingAccount, iban: e.target.value })
                  }
                  placeholder="e.g. PK00BANK0000000000000000"
                />
              </div>

              <div>
                <Input
                  label="Display Title (English)"
                  value={editingAccount.title?.en || ''}
                  onChange={(e) =>
                    setEditingAccount({
                      ...editingAccount,
                      title: {
                        en: e.target.value,
                        ur: editingAccount.title?.ur || '',
                        'ur-roman': editingAccount.title?.['ur-roman'] || '',
                      },
                    })
                  }
                  placeholder="e.g. Online Bank Transfer"
                />
              </div>

              <div>
                <label className="block text-[#8A93A3] mb-1 font-semibold">Instructions for Customers (English)</label>
                <textarea
                  rows={2}
                  value={editingAccount.instructions?.en || ''}
                  onChange={(e) =>
                    setEditingAccount({
                      ...editingAccount,
                      instructions: {
                        en: e.target.value,
                        ur: editingAccount.instructions?.ur || '',
                        'ur-roman': editingAccount.instructions?.['ur-roman'] || '',
                      },
                    })
                  }
                  placeholder="e.g. Transfer the exact amount and submit the transaction receipt with your TID."
                  className="w-full bg-[#0E1013] border border-white/15 rounded p-2 text-white text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="account_is_active"
                  checked={editingAccount.is_active ?? true}
                  onChange={(e) =>
                    setEditingAccount({ ...editingAccount, is_active: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#FF6A00] rounded"
                />
                <label htmlFor="account_is_active" className="text-white font-medium cursor-pointer">
                  Account is active and displayed to customers
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setAccountModalOpen(false);
                    setEditingAccount(null);
                  }}
                  disabled={savingAccount}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={savingAccount}
                >
                  Save Account
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
