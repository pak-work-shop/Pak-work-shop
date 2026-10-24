import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Star,
  ShieldCheck,
  MessageSquare,
  Filter,
  CheckCircle2,
  AlertCircle,
  Wrench,
  ThumbsUp,
  User,
  Calendar,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { useSiteSettings } from '../settings/useSiteSettings';
import { getLocalized } from '../../i18n/helpers';
import { Seo } from '../../components/common/Seo';
import { JsonLd } from '../../components/common/JsonLd';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import type { ReviewRow, ReviewSummary, ServiceRow } from '../../types/database';

export default function ReviewsPage() {
  const { t, i18n } = useTranslation();
  const { settings } = useSiteSettings();

  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedRating, setSelectedRating] = useState<number | 'all'>('all');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all');

  // Review Form Modal / Drawer state
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formName, setFormName] = useState<string>('');
  const [formRating, setFormRating] = useState<number>(5);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formBody, setFormBody] = useState<string>('');
  const [formServiceId, setFormServiceId] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formHoneypot, setFormHoneypot] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);

  const fetchReviewsAndSummary = async () => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [revRes, srvRes, sumRes] = await Promise.all([
        supabase
          .from('reviews')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false }),
        supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase.rpc('get_review_summary'),
      ]);

      if (revRes.data) setReviews(revRes.data);
      if (srvRes.data) setServices(srvRes.data);
      if (sumRes.data) {
        setSummary(sumRes.data as unknown as ReviewSummary);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReviewsAndSummary();
  }, []);

  const serviceMap = useMemo(() => {
    const map = new Map<string, ServiceRow>();
    services.forEach((s) => map.set(s.id, s));
    return map;
  }, [services]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (selectedRating !== 'all' && r.rating !== selectedRating) {
        return false;
      }
      if (selectedServiceId !== 'all' && r.service_id !== selectedServiceId) {
        return false;
      }
      return true;
    });
  }, [reviews, selectedRating, selectedServiceId]);

  // Aggregate rating computation if summary RPC not returned
  const effectiveSummary = useMemo<ReviewSummary>(() => {
    if (summary && summary.total_reviews > 0) return summary;

    const total = reviews.length;
    if (total === 0) {
      return {
        total_reviews: 0,
        average_rating: 0,
        star_counts: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
      };
    }

    const counts = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
    let sum = 0;
    reviews.forEach((r) => {
      sum += r.rating;
      const key = String(r.rating) as '1' | '2' | '3' | '4' | '5';
      if (counts[key] !== undefined) counts[key] += 1;
    });

    return {
      total_reviews: total,
      average_rating: Number((sum / total).toFixed(1)),
      star_counts: counts,
    };
  }, [summary, reviews]);

  // Count of real (non-demo) approved reviews
  const realApprovedReviewsCount = useMemo(() => {
    return reviews.filter((r) => !r.is_demo).length;
  }, [reviews]);

  // Rule: AggregateRating JSON-LD is output ONLY when demo_mode is false AND there are at least 5 approved real reviews
  const aggregateRatingJsonLd = useMemo(() => {
    const isDemoMode = settings.demo_mode;
    if (isDemoMode || realApprovedReviewsCount < 5) {
      return null;
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return {
      '@context': 'https://schema.org',
      '@type': 'AutoRepair',
      name: settings.business_name || 'Pak Auto Works & Parts',
      url: `${origin}/reviews`,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: effectiveSummary.average_rating.toString(),
        reviewCount: realApprovedReviewsCount.toString(),
        bestRating: '5',
        worstRating: '1',
      },
    };
  }, [settings.demo_mode, realApprovedReviewsCount, settings.business_name, effectiveSummary]);

  // Handle Review Submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Spam honeypot
    if (formHoneypot) {
      setSubmitSuccess(true);
      return;
    }

    // Rate limiting cooldown (minimum 30 seconds between local submissions)
    const now = Date.now();
    if (now - lastSubmitTime < 30000) {
      setErrorMessage(t('reviews.cooldownMsg', 'Please wait a moment before submitting another review.'));
      return;
    }

    if (!formName.trim() || formName.trim().length < 2) {
      setErrorMessage(t('reviews.errorName', 'Please provide your name (at least 2 characters).'));
      return;
    }

    if (!formBody.trim() || formBody.trim().length < 10) {
      setErrorMessage(
        t('reviews.errorBody', 'Please write a review of at least 10 characters (up to 1200 characters).')
      );
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('submit_review', {
        p_name: formName.trim(),
        p_rating: formRating,
        p_title: formTitle.trim() || null,
        p_body: formBody.trim(),
        p_service_id: formServiceId || null,
        p_phone: formPhone.trim() || null,
        p_language: i18n.language || 'en',
      });

      if (error) {
        throw error;
      }

      setSubmitSuccess(true);
      setLastSubmitTime(now);
      setFormName('');
      setFormRating(5);
      setFormTitle('');
      setFormBody('');
      setFormServiceId('');
      setFormPhone('');
    } catch (err: unknown) {
      console.error('Review submission error:', err);
      const msg = err instanceof Error ? err.message : t('reviews.errorFailed', 'Failed to submit review.');
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1013] text-[#F5F6F8]">
      <Seo
        title={t('reviews.pageTitle', 'Customer Reviews & Ratings')}
        description={t(
          'reviews.pageDescription',
          'Read genuine customer feedback and ratings for auto repair, periodic maintenance, and spare parts at Pak Auto Works in Sadiqabad.'
        )}
        canonicalPath="/reviews"
      />
      {aggregateRatingJsonLd && <JsonLd data={aggregateRatingJsonLd} />}

      {/* Header Banner */}
      <section className="relative py-14 sm:py-18 border-b border-white/10 bg-gradient-to-b from-[#1B1F26] to-[#0E1013]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF6A00]/10 border border-[#FF6A00]/30 text-[#FF6A00] text-xs font-semibold uppercase tracking-wider mb-4">
                <Star className="w-3.5 h-3.5 fill-[#FF6A00]" />
                <span>{t('reviews.badge', 'Verified Feedback')}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight">
                {t('reviews.heading', 'Customer Reviews & Workshop Trust')}
              </h1>
              <p className="mt-3 text-base text-[#8A93A3] leading-relaxed">
                {t(
                  'reviews.subtitle',
                  'Honest experiences from vehicle owners across Sadiqabad and nationwide spare parts buyers.'
                )}
              </p>
            </div>

            <div>
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  setShowForm(!showForm);
                  setSubmitSuccess(false);
                  setErrorMessage('');
                }}
                leftIcon={<MessageSquare className="w-4 h-4" />}
              >
                {showForm ? t('reviews.closeForm', 'Close Form') : t('reviews.writeReview', 'Write a Review')}
              </Button>
            </div>
          </div>

          {/* Rating Summary Card */}
          <div className="mt-10 bg-[#12151A] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Overall Score */}
              <div className="md:col-span-4 text-center md:text-start md:border-e md:border-white/10 md:pe-8">
                <div className="text-5xl sm:text-6xl font-black font-heading text-white">
                  {effectiveSummary.average_rating > 0 ? effectiveSummary.average_rating.toFixed(1) : '5.0'}
                </div>
                <div className="flex items-center justify-center md:justify-start gap-1 text-[#FFC21A] my-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(effectiveSummary.average_rating)
                          ? 'fill-[#FFC21A] text-[#FFC21A]'
                          : 'text-white/20'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#8A93A3]">
                  {t('reviews.basedOn', 'Based on')}{' '}
                  <strong className="text-white font-semibold">{effectiveSummary.total_reviews}</strong>{' '}
                  {t('reviews.approvedReviews', 'approved customer reviews')}
                </span>
                {settings.demo_mode && (
                  <div className="mt-2 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded inline-block">
                    {t('reviews.demoNotice', 'Demo Mode: includes sample showcase reviews')}
                  </div>
                )}
              </div>

              {/* Star Distribution Bars */}
              <div className="md:col-span-8 space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const key = String(stars) as '1' | '2' | '3' | '4' | '5';
                  const count = effectiveSummary.star_counts[key] || 0;
                  const pct =
                    effectiveSummary.total_reviews > 0
                      ? Math.round((count / effectiveSummary.total_reviews) * 100)
                      : 0;

                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <span className="w-12 text-[#8A93A3] flex items-center gap-1 font-medium">
                        <span>{stars}</span>
                        <Star className="w-3 h-3 fill-[#FFC21A] text-[#FFC21A]" />
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-[#FF6A00] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-12 text-end text-[#8A93A3] font-mono">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Review Submission Form (Expandable) */}
      {showForm && (
        <section className="bg-[#161A20] border-b border-white/10 py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto bg-[#1B1F26] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
            {submitSuccess ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold font-heading text-white mb-2">
                  {t('reviews.thankYouTitle', 'Thank You for Your Feedback!')}
                </h3>
                <p className="text-sm text-[#8A93A3] max-w-md mx-auto mb-5 leading-relaxed">
                  {t(
                    'reviews.pendingApprovalMsg',
                    'Your review has been submitted and is currently pending moderation. Once approved by our team, it will appear publicly.'
                  )}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setSubmitSuccess(false);
                  }}
                >
                  {t('common.done', 'Done')}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-5">
                <div>
                  <h3 className="text-xl font-bold font-heading text-white mb-1">
                    {t('reviews.formHeading', 'Share Your Experience')}
                  </h3>
                  <p className="text-xs text-[#8A93A3]">
                    {t(
                      'reviews.formSubtitle',
                      'Help others in Sadiqabad learn about our workmanship and service speed.'
                    )}
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Rating Stars Input */}
                <div>
                  <label className="block text-xs font-semibold text-white mb-1.5">
                    {t('reviews.yourRating', 'Your Rating (1 to 5 Stars)')}
                  </label>
                  <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormRating(star)}
                        className="p-1 text-[#FFC21A] hover:scale-110 transition-transform focus:outline-none"
                        aria-label={`${star} star`}
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= formRating
                              ? 'fill-[#FFC21A] text-[#FFC21A]'
                              : 'text-white/20'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ms-2 text-xs font-bold text-white">
                      {formRating} {formRating === 1 ? 'Star' : 'Stars'}
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    {t('reviews.nameLabel', 'Your Full Name')} <span className="text-[#FF6A00]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Tariq Mehmood"
                    className="w-full bg-[#12151A] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                {/* Review Title (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    {t('reviews.titleLabel', 'Review Headline (Optional)')}
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={t('reviews.titlePlaceholder', 'e.g. Quick suspension repair and genuine parts')}
                    className="w-full bg-[#12151A] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                {/* Service Dropdown (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    {t('reviews.serviceLabel', 'Workshop Service Performed (Optional)')}
                  </label>
                  <select
                    value={formServiceId}
                    onChange={(e) => setFormServiceId(e.target.value)}
                    className="w-full bg-[#12151A] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6A00]"
                  >
                    <option value="">{t('reviews.selectService', 'Select Service (or General)')}</option>
                    {services.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {getLocalized(srv.name, i18n.language)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Review Text Body */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-white">
                      {t('reviews.bodyLabel', 'Your Review')} <span className="text-[#FF6A00]">*</span>
                    </label>
                    <span className="text-[11px] text-[#8A93A3] font-mono">
                      {formBody.length} / 1200
                    </span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    minLength={10}
                    maxLength={1200}
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    placeholder={t(
                      'reviews.bodyPlaceholder',
                      'Describe your experience with the car repair, parts quality, pricing, and advisor communication...'
                    )}
                    className="w-full bg-[#12151A] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>

                {/* Optional Phone Verification for Verified Customer Badge */}
                <div className="p-3.5 rounded-xl bg-[#12151A] border border-white/10 space-y-2">
                  <label className="block text-xs font-semibold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{t('reviews.verifyPhoneLabel', 'Mobile Number for Verified Badge (Optional)')}</span>
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full bg-[#1B1F26] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
                  />
                  <div className="flex items-start gap-1.5 text-[11px] text-[#8A93A3] leading-relaxed">
                    <Lock className="w-3.5 h-3.5 text-[#8A93A3] shrink-0 mt-0.5" />
                    <span>
                      {t(
                        'reviews.verifyPhoneDisclaimer',
                        'If your phone matches a completed job card, booking, or parts order, you will receive a Verified Customer badge. Your phone number is strictly hashed and never displayed publicly.'
                      )}
                    </span>
                  </div>
                </div>

                {/* Spam Honeypot (Hidden) */}
                <div className="hidden" aria-hidden="true">
                  <input
                    type="text"
                    tabIndex={-1}
                    value={formHoneypot}
                    onChange={(e) => setFormHoneypot(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setShowForm(false)}
                  >
                    {t('common.cancel', 'Cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={submitting}
                  >
                    {t('reviews.submitBtn', 'Submit Review')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </section>
      )}

      {/* Main Reviews List Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#8A93A3] uppercase tracking-wider flex items-center gap-1.5 me-2">
              <Filter className="w-3.5 h-3.5" />
              <span>{t('common.filter', 'Filter')}:</span>
            </span>

            {/* Rating Filter Buttons */}
            <button
              type="button"
              onClick={() => setSelectedRating('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                selectedRating === 'all'
                  ? 'bg-[#FF6A00] text-white'
                  : 'bg-[#1B1F26] text-[#8A93A3] hover:text-white border border-white/10'
              }`}
            >
              {t('common.allRatings', 'All Stars')}
            </button>
            {[5, 4, 3, 2, 1].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedRating(st)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors flex items-center gap-1 ${
                  selectedRating === st
                    ? 'bg-[#FF6A00] text-white'
                    : 'bg-[#1B1F26] text-[#8A93A3] hover:text-white border border-white/10'
                }`}
              >
                <span>{st}</span>
                <Star className="w-2.5 h-2.5 fill-current" />
              </button>
            ))}
          </div>

          {/* Service Filter Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#8A93A3] hidden sm:inline">
              {t('reviews.filterService', 'Service')}:
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="bg-[#1B1F26] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FF6A00]"
            >
              <option value="all">{t('common.allServices', 'All Workshop Services')}</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {getLocalized(s.name, i18n.language)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reviews Cards List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" label={t('common.loading')} />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-16 text-center bg-[#1B1F26] border border-white/10 rounded-2xl p-8 max-w-lg mx-auto">
            <Star className="w-12 h-12 text-[#8A93A3] mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold text-white mb-1">
              {t('reviews.noReviewsMatch', 'No reviews match your filter')}
            </h3>
            <p className="text-xs text-[#8A93A3] mb-4">
              {t('reviews.noReviewsMatchDesc', 'Try resetting your rating or service filter to view all customer feedback.')}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedRating('all');
                setSelectedServiceId('all');
              }}
            >
              {t('common.resetFilters', 'Reset Filters')}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReviews.map((rev) => {
              const srv = rev.service_id ? serviceMap.get(rev.service_id) : null;
              const replyText = rev.admin_reply ? getLocalized(rev.admin_reply, i18n.language) : '';

              return (
                <div
                  key={rev.id}
                  className="bg-[#1B1F26] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-sm hover:border-white/20 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#12151A] border border-white/10 flex items-center justify-center text-[#FF6A00] font-bold text-sm">
                        {rev.reviewer_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-bold text-white">
                            {rev.reviewer_name}
                          </h4>
                          {rev.is_verified && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                              <ShieldCheck className="w-3 h-3" />
                              <span>{t('reviews.verifiedCustomer', 'Verified Customer')}</span>
                            </span>
                          )}
                          {rev.is_demo && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-medium">
                              {t('reviews.sampleTag', 'Sample review')}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[#8A93A3] mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(rev.created_at).toLocaleDateString(
                              i18n.language === 'ur' ? 'ur-PK' : 'en-PK',
                              { dateStyle: 'medium' }
                            )}
                          </span>
                          {srv && (
                            <>
                              <span>•</span>
                              <span className="text-[#F5F6F8] font-medium">
                                {getLocalized(srv.name, i18n.language)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 text-[#FFC21A]">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= rev.rating ? 'fill-[#FFC21A] text-[#FFC21A]' : 'text-white/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Review Title */}
                  {rev.title && (
                    <h5 className="text-sm sm:text-base font-bold text-white mb-2">
                      {rev.title}
                    </h5>
                  )}

                  {/* Review Body */}
                  <p className="text-xs sm:text-sm text-[#8A93A3] leading-relaxed whitespace-pre-line">
                    {rev.body}
                  </p>

                  {/* Workshop Admin Reply */}
                  {replyText && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="p-4 rounded-xl bg-[#12151A] border border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#FF6A00] flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5" />
                            <span>{settings.business_name || 'Pak Auto Works'} ({t('reviews.workshopReply', 'Workshop Reply')})</span>
                          </span>
                        </div>
                        <p className="text-xs text-[#F5F6F8] leading-relaxed">
                          {replyText}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
