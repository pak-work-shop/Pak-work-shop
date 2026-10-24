import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  Wallet,
  XCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatKarachiDateTime, formatPKR } from '../../lib/format';
import type { OrderRow, PaymentLogRow, PaymentRow } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { notifyAdminPaymentsUpdated } from './AdminSidebar';

interface PaymentWithOrder extends PaymentRow {
  orders?: OrderRow | null;
}

export function PaymentsAdminPage() {
  const { t } = useTranslation();

  const [payments, setPayments] = useState<PaymentWithOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'submitted' | 'verified' | 'rejected' | 'all'>('submitted');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedPayment, setSelectedPayment] = useState<PaymentWithOrder | null>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [proofLoading, setProofLoading] = useState<boolean>(false);
  const [logs, setLogs] = useState<PaymentLogRow[]>([]);

  // Action states
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [verifyNote, setVerifyNote] = useState<string>('');

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select('*, orders(*)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load payments:', error);
        setPayments([]);
        return;
      }

      setPayments((data as unknown as PaymentWithOrder[]) || []);
    } catch (err) {
      console.error(err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  // Load signed proof URL when a payment is selected
  useEffect(() => {
    if (!selectedPayment?.proof_path) {
      setProofUrl(null);
      return;
    }

    let isMounted = true;
    (async () => {
      setProofLoading(true);
      try {
        const { data } = await supabase.storage
          .from('payment-proofs')
          .createSignedUrl(selectedPayment.proof_path!, 3600);
        if (isMounted && data?.signedUrl) {
          setProofUrl(data.signedUrl);
        }
      } catch {
        if (isMounted) setProofUrl(null);
      } finally {
        if (isMounted) setProofLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedPayment]);

  // Load audit logs when a payment is selected
  useEffect(() => {
    if (!selectedPayment) {
      setLogs([]);
      return;
    }

    (async () => {
      const { data } = await supabase
        .from('payment_logs')
        .select('*')
        .or(`payment_id.eq.${selectedPayment.id},order_id.eq.${selectedPayment.order_id}`)
        .order('created_at', { ascending: false });

      setLogs((data as PaymentLogRow[]) || []);
    })();
  }, [selectedPayment]);

  // Filter payments
  const filteredPayments = payments.filter((p) => {
    // Tab filter
    if (activeTab === 'submitted' && p.status !== 'submitted') return false;
    if (activeTab === 'verified' && !['verified', 'succeeded'].includes(p.status)) return false;
    if (activeTab === 'rejected' && !['rejected', 'failed'].includes(p.status)) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const orderNo = p.orders?.order_no?.toLowerCase() || '';
      const phone = p.orders?.customer_phone?.toLowerCase() || '';
      const tx = p.transaction_id?.toLowerCase() || '';
      const name = p.orders?.customer_name?.toLowerCase() || '';
      return orderNo.includes(q) || phone.includes(q) || tx.includes(q) || name.includes(q);
    }

    return true;
  });

  const submittedCount = payments.filter((p) => p.status === 'submitted').length;

  const handleVerify = async () => {
    if (!selectedPayment) return;
    setActionLoading(true);

    try {
      const { data, error } = await supabase.rpc('admin_verify_payment', {
        p_payment_id: selectedPayment.id,
        p_note: verifyNote.trim() || null,
      });

      if (error) {
        throw error;
      }

      toast.success(t('admin.payments.verifiedToast', 'Payment verified and order confirmed!'));
      notifyAdminPaymentsUpdated();
      setVerifyNote('');
      await loadPayments();
      setSelectedPayment(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to verify payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment || !rejectReason.trim()) {
      toast.error('Please provide a reason for rejecting the payment');
      return;
    }

    setActionLoading(true);

    try {
      const { data, error } = await supabase.rpc('admin_reject_payment', {
        p_payment_id: selectedPayment.id,
        p_reason: rejectReason.trim(),
      });

      if (error) {
        throw error;
      }

      toast.success(t('admin.payments.rejectedToast', 'Payment rejected. Customer notified.'));
      notifyAdminPaymentsUpdated();
      setRejectReason('');
      setRejectModalOpen(false);
      await loadPayments();
      setSelectedPayment(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkRefunded = async () => {
    if (!selectedPayment) return;
    if (!window.confirm('Are you sure you want to mark this payment as Refunded?')) return;

    setActionLoading(true);

    try {
      const { data, error } = await supabase.rpc('admin_mark_refunded', {
        p_payment_id: selectedPayment.id,
        p_note: 'Refund processed by administrator',
      });

      if (error) {
        throw error;
      }

      toast.success(t('admin.payments.refundedToast', 'Payment marked as refunded.'));
      notifyAdminPaymentsUpdated();
      await loadPayments();
      setSelectedPayment(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark as refunded');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-heading tracking-wide text-white flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-[#FF6A00]" />
            <span>Store Payments</span>
          </h1>
          <p className="text-xs text-[#8A93A3] mt-0.5">
            Verify manual customer bank/wallet transfers and monitor gateway transactions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void loadPayments()}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>

          <Link to="/admin/payment-settings">
            <Button type="button" variant="primary" size="sm" leftIcon={<Building2 className="w-4 h-4" />}>
              Payment Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#16191E] p-3 rounded-lg border border-white/10">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('submitted')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'submitted'
                ? 'bg-[#FF6A00] text-white shadow'
                : 'text-[#8A93A3] hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Awaiting Verification</span>
            {submittedCount > 0 && (
              <span className="bg-white text-slate-900 rounded-full px-1.5 py-0.2 text-[10px] font-black">
                {submittedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('verified')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'verified'
                ? 'bg-[#FF6A00] text-white shadow'
                : 'text-[#8A93A3] hover:text-white hover:bg-white/5'
            }`}
          >
            Verified / Paid
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'rejected'
                ? 'bg-[#FF6A00] text-white shadow'
                : 'text-[#8A93A3] hover:text-white hover:bg-white/5'
            }`}
          >
            Rejected / Failed
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'all'
                ? 'bg-[#FF6A00] text-white shadow'
                : 'text-[#8A93A3] hover:text-white hover:bg-white/5'
            }`}
          >
            All Payments
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#8A93A3] absolute start-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Order, Phone, TxID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0E1013] border border-white/10 rounded-md ps-9 pe-3 py-1.5 text-xs text-white placeholder-[#8A93A3] focus:border-[#FF6A00] focus:outline-none"
          />
        </div>
      </div>

      {/* Main Grid: Payments List + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Payments List (7 cols or 12 cols) */}
        <div className={selectedPayment ? 'lg:col-span-7 space-y-3' : 'lg:col-span-12 space-y-3'}>
          {loading ? (
            <div className="py-16 text-center">
              <Spinner size="lg" label="Loading payments..." />
            </div>
          ) : filteredPayments.length === 0 ? (
            <Card className="p-12 text-center text-[#8A93A3] space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-white font-bold text-sm">No payments in this tab</p>
              <p className="text-xs">All customer payments have been processed or none match your search.</p>
            </Card>
          ) : (
            <div className="divide-y divide-white/10 border border-white/10 rounded-lg overflow-hidden bg-[#16191E]">
              {filteredPayments.map((p) => {
                const isSelected = selectedPayment?.id === p.id;
                const orderTotal = Number(p.orders?.total ?? 0);
                const hasAmountMismatch = Math.abs(Number(p.amount) - orderTotal) > 0.01;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPayment(p)}
                    className={`p-4 cursor-pointer transition-colors flex flex-wrap items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-[#FF6A00]/10 border-s-4 border-[#FF6A00]'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white">
                          {p.orders?.order_no || 'ORD-UNKNOWN'}
                        </span>
                        <Badge
                          variant={
                            p.status === 'verified' || p.status === 'succeeded'
                              ? 'success'
                              : p.status === 'submitted'
                                ? 'warning'
                                : 'danger'
                          }
                        >
                          {p.status}
                        </Badge>
                        {p.provider === 'mock' && <Badge variant="neutral">Mock</Badge>}
                        {hasAmountMismatch && (
                          <Badge variant="danger">Amount Mismatch</Badge>
                        )}
                      </div>

                      <p className="text-xs text-[#8A93A3]">
                        {p.orders?.customer_name || 'Customer'} •{' '}
                        <span className="font-mono" dir="ltr">{p.orders?.customer_phone}</span> •{' '}
                        {p.orders?.city}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-[#8A93A3] pt-0.5">
                        <span className="uppercase font-semibold text-white/80">{p.method}</span>
                        {p.transaction_id && (
                          <>
                            <span>•</span>
                            <span className="font-mono" dir="ltr">TxID: {p.transaction_id}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{formatKarachiDateTime(p.submitted_at || p.created_at)}</span>
                      </div>
                    </div>

                    <div className="text-end">
                      <p className="font-mono font-bold text-base text-white">{formatPKR(p.amount)}</p>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="mt-1"
                        rightIcon={<Eye className="w-3 h-3" />}
                      >
                        Inspect
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Payment Inspector Drawer (5 cols) */}
        {selectedPayment && (
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-6 bg-[#16191E] border-white/10 space-y-5 sticky top-20">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h2 className="font-bold text-base text-white flex items-center gap-2">
                    <span>Payment Review</span>
                    <Badge
                      variant={
                        selectedPayment.status === 'verified' || selectedPayment.status === 'succeeded'
                          ? 'success'
                          : selectedPayment.status === 'submitted'
                            ? 'warning'
                            : 'danger'
                      }
                    >
                      {selectedPayment.status}
                    </Badge>
                  </h2>
                  <p className="text-[11px] text-[#8A93A3]">ID: {selectedPayment.id}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="text-[#8A93A3] hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              {/* Order Info & Amount Match Check */}
              <div className="bg-[#0E1013] rounded-lg p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#8A93A3]">Order Number:</span>
                  <Link
                    to={`/admin/orders/${selectedPayment.order_id}`}
                    className="font-mono font-bold text-[#FF6A00] hover:underline flex items-center gap-1"
                  >
                    <span>{selectedPayment.orders?.order_no}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#8A93A3]">Customer:</span>
                  <span className="font-semibold text-white">{selectedPayment.orders?.customer_name}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#8A93A3]">Phone:</span>
                  <span className="font-mono text-white" dir="ltr">{selectedPayment.orders?.customer_phone}</span>
                </div>

                <div className="border-t border-white/10 pt-2 flex justify-between items-center">
                  <span className="text-[#8A93A3]">Order Total:</span>
                  <span className="font-mono text-white font-bold">{formatPKR(selectedPayment.orders?.total)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#8A93A3]">Submitted Amount:</span>
                  <span className="font-mono text-white font-bold">{formatPKR(selectedPayment.amount)}</span>
                </div>

                {Math.abs(Number(selectedPayment.amount) - Number(selectedPayment.orders?.total ?? 0)) > 0.01 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-[11px] text-red-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Warning: Submitted amount does not match order total!</span>
                  </div>
                )}
              </div>

              {/* Transaction & Proof Document */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#8A93A3]">Transaction Reference:</span>
                  <span className="font-mono font-bold text-white bg-white/5 px-2 py-0.5 rounded" dir="ltr">
                    {selectedPayment.transaction_id || 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#8A93A3]">Method / Channel:</span>
                  <span className="uppercase text-white font-semibold">{selectedPayment.method}</span>
                </div>

                {/* Screenshot Viewer */}
                <div>
                  <span className="text-[#8A93A3] block mb-1.5 font-semibold">Payment Proof Screenshot:</span>
                  {proofLoading ? (
                    <div className="p-6 text-center bg-[#0E1013] rounded border border-white/10">
                      <Spinner size="sm" label="Loading signed preview..." />
                    </div>
                  ) : proofUrl ? (
                    <div className="border border-white/15 rounded-lg overflow-hidden bg-[#0E1013] space-y-2">
                      <a href={proofUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={proofUrl}
                          alt="Payment Receipt"
                          className="max-h-60 w-full object-contain hover:opacity-90 transition-opacity"
                        />
                      </a>
                      <div className="p-2 text-center border-t border-white/10">
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#FF6A00] hover:underline flex items-center justify-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open Full Size Proof</span>
                        </a>
                      </div>
                    </div>
                  ) : selectedPayment.proof_path ? (
                    <div className="bg-[#0E1013] p-4 rounded border border-white/10 text-center text-[#8A93A3]">
                      <FileText className="w-6 h-6 text-[#FF6A00] mx-auto mb-1" />
                      <p className="font-mono text-[11px] text-white truncate">{selectedPayment.proof_path}</p>
                      <p className="text-[10px] mt-1">Signed URL unavailable or expired</p>
                    </div>
                  ) : (
                    <div className="bg-[#0E1013] p-3 rounded border border-white/10 text-center text-[#8A93A3] text-[11px]">
                      No screenshot uploaded (Demo or direct submission)
                    </div>
                  )}
                </div>

                {selectedPayment.reject_reason && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-xs text-red-200">
                    <span className="font-bold block mb-0.5">Rejection Reason:</span>
                    <p>{selectedPayment.reject_reason}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2 border-t border-white/10">
                {selectedPayment.status === 'submitted' && (
                  <>
                    <input
                      type="text"
                      placeholder="Optional verification note..."
                      value={verifyNote}
                      onChange={(e) => setVerifyNote(e.target.value)}
                      className="w-full bg-[#0E1013] border border-white/15 rounded px-3 py-1.5 text-xs text-white placeholder-[#8A93A3] mb-1 focus:outline-none focus:border-[#FF6A00]"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        isLoading={actionLoading}
                        onClick={handleVerify}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        Verify & Confirm
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => setRejectModalOpen(true)}
                        className="text-red-300 hover:bg-red-500/20 hover:text-red-200 border-red-500/30"
                        leftIcon={<XCircle className="w-4 h-4 text-red-400" />}
                      >
                        Reject...
                      </Button>
                    </div>
                  </>
                )}

                {['verified', 'succeeded'].includes(selectedPayment.status) && (
                  <div className="flex gap-2">
                    <Link
                      to={`/order/${selectedPayment.order_id}/payment-receipt`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button type="button" variant="secondary" size="sm" className="w-full" leftIcon={<FileText className="w-4 h-4" />}>
                        View Official Receipt
                      </Button>
                    </Link>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      isLoading={actionLoading}
                      onClick={handleMarkRefunded}
                      className="text-amber-300 hover:bg-amber-500/20 border-amber-500/30"
                    >
                      Mark Refunded
                    </Button>
                  </div>
                )}
              </div>

              {/* Audit Timeline */}
              {logs.length > 0 && (
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <span className="text-[11px] uppercase tracking-wider text-[#8A93A3] font-bold block">
                    Audit Event History
                  </span>
                  <div className="space-y-1.5 text-[11px] max-h-40 overflow-y-auto pr-1">
                    {logs.map((log) => (
                      <div key={log.id} className="bg-[#0E1013] p-2 rounded border border-white/5 space-y-0.5">
                        <div className="flex justify-between items-center text-[#FF6A00] font-semibold">
                          <span>{log.event}</span>
                          <span className="text-[#8A93A3] font-normal text-[10px]">
                            {formatKarachiDateTime(log.created_at)}
                          </span>
                        </div>
                        <p className="text-[#8A93A3] font-mono text-[10px] truncate">
                          {JSON.stringify(log.payload)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-[#16191E] border-white/10 p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span>Reject Payment Proof</span>
            </h3>

            <p className="text-xs text-[#8A93A3]">
              Explain to the customer why this payment could not be verified (e.g. transaction ID not found, incorrect amount, or illegible screenshot).
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Transaction ID not found in workshop bank account statement. Please verify your reference number and resubmit."
              className="w-full bg-[#0E1013] border border-white/15 rounded-md p-3 text-xs text-white placeholder-[#8A93A3] focus:outline-none focus:border-[#FF6A00]"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setRejectModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={actionLoading}
                onClick={handleReject}
                className="bg-red-600 hover:bg-red-500 text-white font-bold"
              >
                Confirm Rejection
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
