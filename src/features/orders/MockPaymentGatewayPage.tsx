import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Seo } from '../../components/common/Seo';
import { formatPKR } from '../../lib/format';

export function MockPaymentGatewayPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const orderNo = searchParams.get('order_no') || 'ORD-DEMO';
  const amountParam = searchParams.get('amount');
  const amount = amountParam ? Number(amountParam) : 7950;
  const customerName = searchParams.get('name') || 'Demo Customer';

  const [loading, setLoading] = useState<boolean>(false);
  const [simulatedCardNumber, setSimulatedCardNumber] = useState<string>('4242 •••• •••• 4242');
  const [simulatedExpiry, setSimulatedExpiry] = useState<string>('12/28');
  const [simulatedCvc, setSimulatedCvc] = useState<string>('888');

  const handleOutcome = async (outcome: 'success' | 'failure') => {
    if (!token) {
      toast.error('Missing session token');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('mock_gateway_complete', {
        p_token: token,
        p_outcome: outcome,
      });

      if (error) {
        toast.error(error.message || 'Payment simulation failed');
        return;
      }

      if (outcome === 'success') {
        toast.success(t('mockGateway.successToast', 'Demo payment captured successfully!'));
      } else {
        toast.error(t('mockGateway.declinedToast', 'Demo payment simulated as declined.'));
      }

      // Redirect back to order success with updated state
      const targetOrderNo = data?.order_no || orderNo;
      const targetPhone = data?.phone || '';
      navigate(`/order/success?order_no=${encodeURIComponent(targetOrderNo)}&phone=${encodeURIComponent(targetPhone)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Simulation error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C0E] text-white flex flex-col justify-center items-center py-12 px-4">
      <Seo title="Demo Payment Gateway — Pak Auto Works & Parts" />

      {/* Demo Warning Banner */}
      <div className="w-full max-w-lg mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-200 text-center font-medium flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>DEMO PAYMENT GATEWAY SIMULATION — NO REAL MONEY WILL BE CHARGED</span>
      </div>

      <Card className="w-full max-w-lg bg-[#14171C] border-white/10 shadow-2xl overflow-hidden">
        {/* Hosted Portal Header */}
        <div className="bg-[#1C2027] border-b border-white/10 p-6 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-wide font-heading">
                PAK AUTO WORKS & PARTS
              </span>
              <Badge variant="warning">SANDBOX</Badge>
            </div>
            <p className="text-xs text-[#8A93A3] flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>256-Bit SSL Mock Gateway</span>
            </p>
          </div>
          <div className="text-end">
            <span className="text-[11px] text-[#8A93A3] block uppercase tracking-wider">Total Due</span>
            <span className="text-lg font-mono font-bold text-white">{formatPKR(amount)}</span>
          </div>
        </div>

        {/* Order Details Snapshot */}
        <div className="p-6 border-b border-white/5 bg-[#0E1013]/60 text-xs text-[#8A93A3] flex justify-between items-center">
          <div>
            <span>Order Number: </span>
            <strong className="text-white font-mono">{orderNo}</strong>
          </div>
          <div>
            <span>Customer: </span>
            <strong className="text-white">{customerName}</strong>
          </div>
        </div>

        {/* Simulated Card Form */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#8A93A3] uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#FF6A00]" />
              <span>Simulated Payment Card Details</span>
            </h3>

            {/* Fake Card Input */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-[#8A93A3] mb-1">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={simulatedCardNumber}
                    onChange={(e) => setSimulatedCardNumber(e.target.value)}
                    dir="ltr"
                    className="w-full bg-[#0E1013] border border-white/15 rounded-md px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-[#FF6A00]"
                  />
                  <div className="absolute end-3 top-2.5 flex items-center gap-1">
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded">VISA</span>
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded">MC</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#8A93A3] mb-1">Expires</label>
                  <input
                    type="text"
                    value={simulatedExpiry}
                    onChange={(e) => setSimulatedExpiry(e.target.value)}
                    dir="ltr"
                    className="w-full bg-[#0E1013] border border-white/15 rounded-md px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#8A93A3] mb-1">CVC</label>
                  <input
                    type="text"
                    value={simulatedCvc}
                    onChange={(e) => setSimulatedCvc(e.target.value)}
                    dir="ltr"
                    className="w-full bg-[#0E1013] border border-white/15 rounded-md px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Simulation Buttons */}
          <div className="space-y-3 pt-2">
            <Button
              type="button"
              variant="primary"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              isLoading={loading}
              onClick={() => handleOutcome('success')}
              leftIcon={<CheckCircle2 className="w-5 h-5" />}
            >
              Simulate Successful Payment ({formatPKR(amount)})
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="w-full py-2.5 text-red-300 hover:bg-red-500/20 hover:text-red-200 border-red-500/30"
              isLoading={loading}
              onClick={() => handleOutcome('failure')}
              leftIcon={<XCircle className="w-4 h-4 text-red-400" />}
            >
              Simulate Failed / Declined Payment
            </Button>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-[#8A93A3]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulated Payment Gateway</span>
            </span>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3 rtl-flip" />
              <span>Cancel & Return</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
