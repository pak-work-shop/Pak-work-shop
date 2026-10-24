import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  Image as ImageIcon,
  Send,
  Upload,
  Wallet,
  XCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { formatPKR, pickLocalized } from '../../lib/format';
import type { LanguageCode } from '../../types/i18n';
import type { PaymentOptionsAccount, PaymentRow } from '../../types/database';

interface PaymentProofFormProps {
  orderNo: string;
  phone: string;
  orderTotal: number;
  accounts: PaymentOptionsAccount[];
  existingPayment?: PaymentRow | null;
  requireProof?: boolean;
  isDemoMode?: boolean;
  onProofSubmitted?: () => void;
}

export function PaymentProofForm({
  orderNo,
  phone,
  orderTotal,
  accounts,
  existingPayment,
  requireProof = true,
  isDemoMode = false,
  onProofSubmitted,
}: PaymentProofFormProps) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'en') as LanguageCode;

  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts[0]?.id || ''
  );
  const [transactionId, setTransactionId] = useState<string>('');
  const [amount, setAmount] = useState<string>(String(orderTotal));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const selectedAccount =
    accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  const handleCopy = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    toast.success(t('payment.copiedToast', { label, defaultValue: `${label} copied to clipboard!` }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error(t('payment.fileTooLarge', 'File exceeds 3 MB limit'));
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('payment.invalidFileType', 'Supported file formats: PNG, JPG, WEBP, PDF'));
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      setSubmitError(t('payment.txIdRequired', 'Please enter your transaction ID or reference number'));
      return;
    }

    setUploading(true);
    setSubmitError(null);

    try {
      let proofPath: string | null = null;

      // 1. Upload proof file to private storage bucket if file selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `pending/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, selectedFile, {
            contentType: selectedFile.type,
            upsert: false,
          });

        if (uploadErr) {
          throw new Error(uploadErr.message || 'Failed to upload proof document');
        }

        proofPath = fileName;
      } else if (requireProof && !isDemoMode) {
        throw new Error(t('payment.proofRequiredError', 'Screenshot proof is required to verify your payment.'));
      }

      // 2. Invoke submit_payment_proof RPC
      const { data, error: rpcErr } = await supabase.rpc('submit_payment_proof', {
        p_order_no: orderNo,
        p_phone: phone,
        p_method: selectedAccount?.method || 'bank_transfer',
        p_transaction_id: transactionId.trim(),
        p_proof_path: proofPath,
        p_amount: Number(amount) || orderTotal,
      });

      if (rpcErr) {
        const msg = rpcErr.message || '';
        if (msg.includes('rate_limited')) {
          throw new Error(t('payment.rateLimited', 'Too many attempts. Please try again in a few minutes.'));
        } else if (msg.includes('already_paid')) {
          throw new Error(t('payment.alreadyPaid', 'This order has already been verified and marked as paid.'));
        } else {
          throw new Error(msg || t('payment.submitFailed', 'Failed to submit payment proof.'));
        }
      }

      setSubmitSuccess(true);
      toast.success(t('payment.submitSuccessToast', 'Payment proof submitted successfully! Awaiting verification.'));
      onProofSubmitted?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error submitting proof');
    } finally {
      setUploading(false);
    }
  };

  // If order payment is already verified / succeeded
  if (existingPayment?.status === 'verified' || existingPayment?.status === 'succeeded') {
    return (
      <Card className="p-6 bg-emerald-950/20 border-emerald-500/30 text-white space-y-3">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <div>
            <h3 className="font-bold text-base text-emerald-200">
              {t('payment.verifiedTitle', 'Payment Verified & Confirmed')}
            </h3>
            <p className="text-xs text-emerald-300/80">
              {t('payment.verifiedSubtitle', 'Your payment has been verified. Your order is being processed for dispatch.')}
            </p>
          </div>
        </div>
        {existingPayment.transaction_id && (
          <div className="bg-[#0E1013]/60 rounded p-3 text-xs flex justify-between items-center">
            <span className="text-[#8A93A3]">{t('payment.txIdLabel', 'Transaction Reference')}:</span>
            <span className="font-mono font-semibold text-emerald-300" dir="ltr">
              {existingPayment.transaction_id}
            </span>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8 space-y-6 border-white/10 bg-[#16191E]">
      {/* Header */}
      <div className="border-b border-white/10 pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold font-heading text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#FF6A00]" />
            <span>{t('payment.proofFormTitle', 'Workshop Bank & Wallet Details')}</span>
          </h2>
          <p className="text-xs text-[#8A93A3]">
            {t('payment.proofFormSubtitle', 'Transfer the exact amount to any of our accounts below and submit proof')}
          </p>
        </div>
        <Badge variant={existingPayment?.status === 'submitted' ? 'warning' : 'info'}>
          {existingPayment?.status === 'submitted'
            ? t('payment.statusSubmitted', 'Awaiting Verification')
            : t('payment.statusPending', 'Payment Required')}
        </Badge>
      </div>

      {/* Prior Rejection Warning (if any) */}
      {existingPayment?.status === 'rejected' && existingPayment.reject_reason && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-xs text-red-200 space-y-1">
          <div className="flex items-center gap-2 font-bold text-red-300">
            <XCircle className="w-4 h-4 text-red-400" />
            <span>{t('payment.rejectedHeading', 'Previous Submission Rejected')}</span>
          </div>
          <p>{existingPayment.reject_reason}</p>
          <p className="text-red-300/70 text-[11px] pt-1">
            {t('payment.rejectedPrompt', 'Please double-check your receipt and submit the correct transaction ID below.')}
          </p>
        </div>
      )}

      {/* Account Selection Tabs */}
      {accounts.length > 0 && (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-[#8A93A3] uppercase tracking-wider">
            {t('payment.selectAccountPrompt', 'Select Payment Account')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {accounts.map((acc) => {
              const isSelected = acc.id === selectedAccountId;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`p-3 rounded-lg border text-start transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'border-[#FF6A00] bg-[#FF6A00]/10 text-white shadow-sm'
                      : 'border-white/10 bg-[#0E1013] text-[#8A93A3] hover:border-white/25 hover:text-white'
                  }`}
                >
                  {acc.method === 'bank_transfer' ? (
                    <Building2 className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-[#FF6A00]' : 'text-[#8A93A3]'}`} />
                  ) : (
                    <Wallet className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-[#FF6A00]' : 'text-[#8A93A3]'}`} />
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold truncate">
                      {pickLocalized(acc.title, lang) || acc.account_title}
                    </p>
                    <p className="text-[11px] opacity-75 truncate">{acc.bank_name || acc.account_number}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Account Details Box */}
      {selectedAccount && (
        <div className="bg-[#0E1013] rounded-lg p-5 border border-white/10 space-y-3.5 text-xs text-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <span className="font-bold text-sm text-[#FF6A00]">
              {pickLocalized(selectedAccount.title, lang) || selectedAccount.bank_name}
            </span>
            <span className="text-[11px] text-[#8A93A3]">
              {t('payment.exactAmountToPay', 'Amount to Transfer')}:{' '}
              <strong className="text-white font-mono text-sm">{formatPKR(orderTotal)}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#8A93A3] block mb-0.5">{t('payment.accountTitle', 'Account Title')}</span>
              <p className="font-semibold text-white">{selectedAccount.account_title}</p>
            </div>
            <div>
              <span className="text-[#8A93A3] block mb-0.5">{t('payment.accountNumber', 'Account Number / Mobile')}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-white" dir="ltr">
                  {selectedAccount.account_number}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedAccount.account_number, t('payment.accountNumber', 'Account Number'))}
                  className="p-1 hover:bg-white/10 rounded text-[#8A93A3] hover:text-white"
                  title="Copy"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {selectedAccount.iban && (
            <div>
              <span className="text-[#8A93A3] block mb-0.5">{t('payment.ibanLabel', 'IBAN (For Online Banking)')}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#F5F6F8] break-all" dir="ltr">
                  {selectedAccount.iban}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedAccount.iban!, 'IBAN')}
                  className="p-1 hover:bg-white/10 rounded text-[#8A93A3] hover:text-white"
                  title="Copy IBAN"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Payment Reference */}
          <div className="bg-[#1B1F26] rounded p-2.5 flex items-center justify-between text-xs">
            <span className="text-[#8A93A3]">
              {t('payment.referenceHint', 'Use Order No as Reference')}:{' '}
              <strong className="text-[#FF6A00] font-mono">{orderNo}</strong>
            </span>
            <button
              type="button"
              onClick={() => handleCopy(orderNo, 'Order Number')}
              className="text-[#FF6A00] hover:underline flex items-center gap-1 text-[11px]"
            >
              <Copy className="w-3 h-3" />
              <span>{t('common.copy', 'Copy')}</span>
            </button>
          </div>

          {/* Instructions */}
          {pickLocalized(selectedAccount.instructions, lang) && (
            <p className="text-[11px] text-[#8A93A3] italic pt-1">
              {pickLocalized(selectedAccount.instructions, lang)}
            </p>
          )}
        </div>
      )}

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#FF6A00]" />
          <span>{t('payment.submitProofHeading', 'Submit Transaction Proof')}</span>
        </h3>

        {submitError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <p>{submitError}</p>
          </div>
        )}

        {submitSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p>{t('payment.submitSuccessMsg', 'Proof submitted successfully! Our team will verify and dispatch your order.')}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('payment.fields.transactionId', 'Transaction ID / Reference Number *')}
            placeholder="e.g. 123456789012 or TID-998877"
            dir="ltr"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            required
          />

          <Input
            label={t('payment.fields.amountPaid', 'Amount Paid (PKR) *')}
            dir="ltr"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        {/* File Uploader */}
        <div>
          <label className="block text-xs font-semibold text-[#F5F6F8] mb-1.5">
            {t('payment.fields.screenshotProof', 'Upload Screenshot / Receipt *')}
            <span className="text-[#8A93A3] font-normal text-[11px] ms-1.5">
              (PNG, JPG, WEBP, PDF up to 3 MB)
            </span>
          </label>

          <div className="border-2 border-dashed border-white/15 hover:border-white/30 rounded-lg p-5 text-center cursor-pointer transition-colors relative bg-[#0E1013]">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3 text-xs text-emerald-300">
                {filePreview ? (
                  <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded border border-white/20" />
                ) : (
                  <FileText className="w-8 h-8 text-emerald-400" />
                )}
                <div className="text-start">
                  <p className="font-semibold text-white">{selectedFile.name}</p>
                  <p className="text-[11px] text-[#8A93A3]">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 text-xs text-[#8A93A3]">
                <Upload className="w-6 h-6 text-[#FF6A00] mx-auto mb-1" />
                <p className="text-white font-medium">
                  {t('payment.uploadPrompt', 'Click or drag receipt screenshot here')}
                </p>
                <p className="text-[11px]">PNG, JPG, WEBP or PDF (max 3 MB)</p>
              </div>
            )}
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full sm:w-auto"
          isLoading={uploading}
          leftIcon={<Send className="w-4 h-4" />}
        >
          {t('payment.submitButton', 'Submit Payment for Verification')}
        </Button>
      </form>
    </Card>
  );
}
