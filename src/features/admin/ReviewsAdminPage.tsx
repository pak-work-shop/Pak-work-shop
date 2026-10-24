import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Star,
  CheckCircle2,
  EyeOff,
  Trash2,
  MessageSquare,
  ShieldCheck,
  Search,
  Filter,
  Check,
  X,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { getLocalized } from '../../i18n/helpers';
import { TranslatableField } from '../../components/common/TranslatableField';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { notifyAdminReviewsUpdated } from './AdminSidebar';
import type { LocalizedText, ReviewRow, ReviewStatus, ServiceRow } from '../../types/database';

export default function ReviewsAdminPage() {
  const { t, i18n } = useTranslation();

  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<ReviewStatus>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all');

  // Reply Modal
  const [replyingReview, setReplyingReview] = useState<ReviewRow | null>(null);
  const [replyText, setReplyText] = useState<LocalizedText>({ en: '', ur: '', 'ur-roman': '' });
  const [savingReply, setSavingReply] = useState<boolean>(false);

  // Delete Confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchReviews = async () => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [revRes, srvRes] = await Promise.all([
        supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('services')
          .select('*')
          .order('name', { ascending: true }),
      ]);

      if (revRes.data) setReviews(revRes.data);
      if (srvRes.data) setServices(srvRes.data);
    } catch (err) {
      console.error('Failed to load reviews in admin:', err);
      toast.error('Failed to load customer reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReviews();
  }, []);

  const serviceMap = useMemo(() => {
    const map = new Map<string, ServiceRow>();
    services.forEach((s) => map.set(s.id, s));
    return map;
  }, [services]);

  const counts = useMemo(() => {
    return {
      pending: reviews.filter((r) => r.status === 'pending').length,
      approved: reviews.filter((r) => r.status === 'approved').length,
      hidden: reviews.filter((r) => r.status === 'hidden').length,
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (r.status !== activeTab) return false;
      if (selectedServiceId !== 'all' && r.service_id !== selectedServiceId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = r.reviewer_name.toLowerCase();
        const body = r.body.toLowerCase();
        const title = (r.title || '').toLowerCase();
        return name.includes(q) || body.includes(q) || title.includes(q);
      }
      return true;
    });
  }, [reviews, activeTab, selectedServiceId, searchQuery]);

  // Update Status
  const handleUpdateStatus = async (reviewId: string, nextStatus: ReviewStatus) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status: nextStatus })
        .eq('id', reviewId);

      if (error) throw error;
      toast.success(`Review status changed to ${nextStatus}`);
      notifyAdminReviewsUpdated();
      void fetchReviews();
    } catch (err: unknown) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  // Open Reply Modal
  const openReplyModal = (r: ReviewRow) => {
    setReplyingReview(r);
    const existing = r.admin_reply as LocalizedText | null;
    setReplyText(
      existing || {
        en: `Thank you for choosing Pak Auto Works, ${r.reviewer_name}!`,
        ur: `پاک آٹو ورکس پر اعتماد کرنے کا شکریہ، ${r.reviewer_name}!`,
        'ur-roman': `Pak Auto Works par aetimad ka shukriya, ${r.reviewer_name}!`,
      }
    );
  };

  // Save Reply
  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview) return;

    setSavingReply(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ admin_reply: replyText })
        .eq('id', replyingReview.id);

      if (error) throw error;
      toast.success('Workshop reply saved');
      setReplyingReview(null);
      void fetchReviews();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save workshop reply');
    } finally {
      setSavingReply(false);
    }
  };

  // Delete Review
  const handleDeleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (error) throw error;
      toast.success('Review deleted');
      setDeleteConfirmId(null);
      notifyAdminReviewsUpdated();
      void fetchReviews();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete review');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-white">
            {t('admin.reviews.title', 'Customer Reviews & Moderation')}
          </h1>
          <p className="text-xs sm:text-sm text-[#8A93A3]">
            {t('admin.reviews.subtitle', 'Approve pending reviews, reply to customers, or hide inappropriate feedback.')}
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-[#FF6A00] text-[#FF6A00]'
              : 'border-transparent text-[#8A93A3] hover:text-white'
          }`}
        >
          <span>Pending Moderation</span>
          {counts.pending > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#FF6A00] text-white text-[11px] font-bold">
              {counts.pending}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approved')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'approved'
              ? 'border-[#FF6A00] text-[#FF6A00]'
              : 'border-transparent text-[#8A93A3] hover:text-white'
          }`}
        >
          <span>Approved ({counts.approved})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hidden')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'hidden'
              ? 'border-[#FF6A00] text-[#FF6A00]'
              : 'border-transparent text-[#8A93A3] hover:text-white'
          }`}
        >
          <span>Hidden ({counts.hidden})</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#1B1F26] border border-white/10 p-3 rounded-xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#8A93A3] absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name or text..."
            className="w-full bg-[#12151A] border border-white/10 rounded-lg ps-9 pe-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="bg-[#12151A] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
          >
            <option value="all">All Services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name.en}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reviews Cards List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-[#1B1F26] border border-white/10 rounded-2xl p-12 text-center text-sm text-[#8A93A3]">
          No {activeTab} reviews found.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => {
            const srv = rev.service_id ? serviceMap.get(rev.service_id) : null;
            const reply = rev.admin_reply as LocalizedText | null;

            return (
              <div
                key={rev.id}
                className="bg-[#1B1F26] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-3 shadow-sm hover:border-white/20 transition-colors"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-white text-base">
                      {rev.reviewer_name}
                    </span>
                    {rev.is_verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified Customer</span>
                      </span>
                    )}
                    {rev.is_demo && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-medium">
                        Sample Review
                      </span>
                    )}
                  </div>

                  {/* Stars & Date */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5 text-[#FFC21A]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-[#FFC21A]' : 'text-white/20'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-[#8A93A3]">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Service Tag */}
                {srv && (
                  <div className="text-xs text-[#8A93A3]">
                    Service: <span className="text-[#FF6A00] font-medium">{srv.name.en}</span>
                  </div>
                )}

                {/* Title & Body */}
                {rev.title && (
                  <h4 className="font-bold text-sm text-white">{rev.title}</h4>
                )}
                <p className="text-xs sm:text-sm text-[#F5F6F8] leading-relaxed whitespace-pre-line bg-[#12151A] p-3 rounded-xl border border-white/5">
                  {rev.body}
                </p>

                {/* Workshop Reply Display */}
                {reply && (reply.en || reply.ur) && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#FF6A00]">
                      <span>Workshop Reply:</span>
                      <button
                        type="button"
                        onClick={() => openReplyModal(rev)}
                        className="text-[#8A93A3] hover:text-white underline text-[10px]"
                      >
                        Edit Reply
                      </button>
                    </div>
                    <p className="text-xs text-[#8A93A3]">
                      {reply.en || reply['ur-roman'] || reply.ur}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    {rev.status !== 'approved' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateStatus(rev.id, 'approved')}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                      >
                        Approve
                      </Button>
                    )}

                    {rev.status !== 'hidden' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateStatus(rev.id, 'hidden')}
                        leftIcon={<EyeOff className="w-3.5 h-3.5" />}
                      >
                        Hide
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openReplyModal(rev)}
                      leftIcon={<MessageSquare className="w-3.5 h-3.5 text-[#FF6A00]" />}
                    >
                      {reply ? 'Edit Reply' : 'Add Reply'}
                    </Button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(rev.id)}
                    className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REPLY MODAL */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1B1F26] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#FF6A00]" />
                <span>Reply to {replyingReview.reviewer_name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setReplyingReview(null)}
                className="text-[#8A93A3] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReply} className="space-y-4">
              <TranslatableField
                label="Workshop Response"
                multiline
                rows={3}
                value={replyText}
                onChange={setReplyText}
                placeholder={{ en: 'Write a courteous reply on behalf of Pak Auto Works...' }}
              />

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingReview(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={savingReply}
                >
                  Save Workshop Reply
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1B1F26] border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
            <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-2">Delete Review?</h3>
            <p className="text-xs text-[#8A93A3] mb-5">
              This will permanently delete the customer review from the database.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteReview(deleteConfirmId)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
