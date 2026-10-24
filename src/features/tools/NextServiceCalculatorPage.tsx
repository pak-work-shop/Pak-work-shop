import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  CalendarClock,
  Gauge,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { Seo } from '../../components/common/Seo';
import { JsonLd } from '../../components/common/JsonLd';
import { Button } from '../../components/ui/Button';

interface ServiceIntervalPreset {
  id: string;
  nameEn: string;
  nameUr: string;
  nameUrRoman: string;
  defaultKm: number;
  defaultMonths: number;
  serviceSlug: string;
}

const SERVICE_PRESETS: ServiceIntervalPreset[] = [
  {
    id: 'oil',
    nameEn: 'Engine Oil & Filter Change',
    nameUr: 'انجن آئل اور آئل فلٹر کی تبدیلی',
    nameUrRoman: 'Engine Oil & Oil Filter Change',
    defaultKm: 5000,
    defaultMonths: 5,
    serviceSlug: 'oil-change-service',
  },
  {
    id: 'general',
    nameEn: 'Periodic General Service & Tuning',
    nameUr: 'پیریوڈک جنرل سروس و ٹیوننگ',
    nameUrRoman: 'Periodic General Service & Tuning',
    defaultKm: 10000,
    defaultMonths: 6,
    serviceSlug: 'general-inspection',
  },
  {
    id: 'brakes',
    nameEn: 'Brake Pads & System Inspection',
    nameUr: 'بریک پیڈز اور بریک سسٹم کا معائنہ',
    nameUrRoman: 'Brake Pads & System Inspection',
    defaultKm: 10000,
    defaultMonths: 6,
    serviceSlug: 'brakes',
  },
  {
    id: 'tyres',
    nameEn: 'Tyre Rotation & High-Speed Balancing',
    nameUr: 'ٹائر روٹیشن اور وہیل بیلنسنگ',
    nameUrRoman: 'Tyre Rotation & Wheel Balancing',
    defaultKm: 8000,
    defaultMonths: 6,
    serviceSlug: 'wheel-alignment-balancing',
  },
  {
    id: 'transmission',
    nameEn: 'CVT / Automatic Transmission Fluid',
    nameUr: 'سی وی ٹی / آٹومیٹک گیئر آئل',
    nameUrRoman: 'CVT / Auto Transmission Fluid',
    defaultKm: 35000,
    defaultMonths: 24,
    serviceSlug: 'transmission-gearbox',
  },
];

export default function NextServiceCalculatorPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [selectedPresetId, setSelectedPresetId] = useState<string>('oil');
  const [lastServiceDate, setLastServiceDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    return d.toISOString().split('T')[0];
  });
  const [currentOdometer, setCurrentOdometer] = useState<number>(45000);
  const [lastServiceOdometer, setLastServiceOdometer] = useState<number>(41200);
  const [customIntervalKm, setCustomIntervalKm] = useState<string>('');
  const [customIntervalMonths, setCustomIntervalMonths] = useState<string>('');

  const activePreset = useMemo(() => {
    return SERVICE_PRESETS.find((p) => p.id === selectedPresetId) || SERVICE_PRESETS[0];
  }, [selectedPresetId]);

  const targetKmInterval = useMemo(() => {
    const custom = parseInt(customIntervalKm, 10);
    return !isNaN(custom) && custom > 0 ? custom : activePreset.defaultKm;
  }, [customIntervalKm, activePreset]);

  const targetMonthsInterval = useMemo(() => {
    const custom = parseInt(customIntervalMonths, 10);
    return !isNaN(custom) && custom > 0 ? custom : activePreset.defaultMonths;
  }, [customIntervalMonths, activePreset]);

  // Calculations
  const result = useMemo(() => {
    const kmDrivenSinceService = Math.max(0, currentOdometer - lastServiceOdometer);
    const nextDueKm = lastServiceOdometer + targetKmInterval;
    const remainingKm = nextDueKm - currentOdometer;

    const lastDate = new Date(lastServiceDate);
    const dueDate = new Date(lastDate);
    dueDate.setMonth(dueDate.getMonth() + targetMonthsInterval);

    const now = new Date();
    const msDiff = dueDate.getTime() - now.getTime();
    const remainingDays = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

    // Urgency status: OK / Due Soon / Overdue
    let status: 'ok' | 'due_soon' | 'overdue' = 'ok';
    if (remainingKm <= 0 || remainingDays <= 0) {
      status = 'overdue';
    } else if (remainingKm <= 500 || remainingDays <= 14) {
      status = 'due_soon';
    }

    return {
      kmDrivenSinceService,
      nextDueKm,
      remainingKm,
      dueDate,
      remainingDays,
      status,
    };
  }, [
    currentOdometer,
    lastServiceOdometer,
    targetKmInterval,
    targetMonthsInterval,
    lastServiceDate,
  ]);

  const localizedPresetName = useMemo(() => {
    if (i18n.language === 'ur') return activePreset.nameUr;
    if (i18n.language === 'ur-roman') return activePreset.nameUrRoman;
    return activePreset.nameEn;
  }, [activePreset, i18n.language]);

  const jsonLdData = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Pak Auto Works Next Service Calculator',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'All',
      url: `${origin}/tools/next-service`,
      description:
        'Car periodic maintenance and oil change next service due calculator for drivers in Pakistan.',
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0E1013] text-[#F5F6F8]">
      <Seo
        title={t('tools.nextServiceCalculatorTitle', 'Next Service & Maintenance Calculator')}
        description={t(
          'tools.calculatorMetaDesc',
          'Calculate when your next car oil change, brake inspection, or periodic maintenance is due based on odometer reading and driving duration.'
        )}
        canonicalPath="/tools/next-service"
      />
      <JsonLd data={jsonLdData} />

      {/* Header */}
      <section className="relative py-12 sm:py-16 border-b border-white/10 bg-gradient-to-b from-[#1B1F26] to-[#0E1013]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs text-[#8A93A3] mb-3">
              <Link to="/tools" className="hover:text-white transition-colors">
                {t('nav.tools', 'Tools')}
              </Link>
              <span>/</span>
              <span className="text-[#F5F6F8]">
                {t('tools.serviceCalculator', 'Service Calculator')}
              </span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFC21A]/10 border border-[#FFC21A]/30 text-[#FFC21A] text-xs font-semibold uppercase tracking-wider mb-3">
              <CalendarClock className="w-3.5 h-3.5" />
              <span>{t('tools.odometerHelper', 'Mileage & Schedule Planner')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
              {t('tools.nextServiceHeading', 'Car Next Service Due Calculator')}
            </h1>

            <p className="mt-3 text-sm sm:text-base text-[#8A93A3] leading-relaxed">
              {t(
                'tools.calculatorSubtitle',
                'Enter your recent maintenance history to calculate the exact odometer km and date your vehicle needs its next servicing.'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Calculator Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inputs Section (Col 7) */}
          <div className="lg:col-span-7 bg-[#1B1F26] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8A93A3] mb-2.5">
                {t('tools.selectServiceType', '1. Service Type')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SERVICE_PRESETS.map((p) => {
                  const isSelected = selectedPresetId === p.id;
                  const label =
                    i18n.language === 'ur'
                      ? p.nameUr
                      : i18n.language === 'ur-roman'
                      ? p.nameUrRoman
                      : p.nameEn;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPresetId(p.id);
                        setCustomIntervalKm('');
                        setCustomIntervalMonths('');
                      }}
                      className={`p-3 rounded-xl border text-start transition-all ${
                        isSelected
                          ? 'bg-[#FF6A00]/15 border-[#FF6A00] text-white ring-1 ring-[#FF6A00]'
                          : 'bg-[#12151A] border-white/10 text-[#8A93A3] hover:text-white hover:border-white/20'
                      }`}
                    >
                      <div className="font-bold text-xs sm:text-sm text-white mb-1">
                        {label}
                      </div>
                      <div className="text-[11px] text-[#FFC21A]">
                        {p.defaultKm.toLocaleString()} km / {p.defaultMonths} months
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Odometer Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-[#FF6A00]" />
                  <span>{t('tools.currentOdometer', 'Current Odometer (km)')}</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={currentOdometer}
                  onChange={(e) => setCurrentOdometer(Number(e.target.value))}
                  className="w-full bg-[#12151A] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1.5 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-[#8A93A3]" />
                  <span>{t('tools.lastOdometer', 'Odometer at Last Service (km)')}</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={lastServiceOdometer}
                  onChange={(e) => setLastServiceOdometer(Number(e.target.value))}
                  className="w-full bg-[#12151A] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6A00]"
                />
              </div>
            </div>

            {/* Date Input */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-white mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#FFC21A]" />
                <span>{t('tools.lastServiceDate', 'Date of Last Service')}</span>
              </label>
              <input
                type="date"
                value={lastServiceDate}
                onChange={(e) => setLastServiceDate(e.target.value)}
                className="w-full sm:w-1/2 bg-[#12151A] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6A00]"
              />
            </div>

            {/* Optional Custom Interval Overrides */}
            <div className="pt-4 border-t border-white/10">
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#8A93A3] mb-3">
                {t('tools.customIntervalPrompt', 'Custom Interval (Optional Override):')}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[#8A93A3] mb-1">
                    {t('tools.customKm', 'Interval Kilometers')}
                  </label>
                  <input
                    type="number"
                    placeholder={`Default: ${activePreset.defaultKm} km`}
                    value={customIntervalKm}
                    onChange={(e) => setCustomIntervalKm(e.target.value)}
                    className="w-full bg-[#12151A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-[#8A93A3] focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#8A93A3] mb-1">
                    {t('tools.customMonths', 'Interval Months')}
                  </label>
                  <input
                    type="number"
                    placeholder={`Default: ${activePreset.defaultMonths} months`}
                    value={customIntervalMonths}
                    onChange={(e) => setCustomIntervalMonths(e.target.value)}
                    className="w-full bg-[#12151A] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-[#8A93A3] focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>
            </div>

            {/* Owner Manual Note */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5 text-xs text-[#8A93A3]">
              <Info className="w-4 h-4 text-[#FF6A00] shrink-0 mt-0.5" />
              <span>
                {t(
                  'tools.ownerManualNote',
                  'Standard intervals shown are common Pakistani workshop baselines. Always consult your vehicle owner’s manual for manufacturer-recommended severe-driving specifications.'
                )}
              </span>
            </div>
          </div>

          {/* Results Summary Section (Col 5) */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-[#1B1F26] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-lg">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-lg font-bold font-heading text-white">
                  {t('tools.serviceDueSummary', 'Service Status')}
                </h3>
                {/* Status Badge */}
                {result.status === 'ok' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('tools.statusOk', 'OK (Good)')}</span>
                  </span>
                )}
                {result.status === 'due_soon' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{t('tools.statusDueSoon', 'Due Soon')}</span>
                  </span>
                )}
                {result.status === 'overdue' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{t('tools.statusOverdue', 'Overdue!')}</span>
                  </span>
                )}
              </div>

              {/* Due Date & Odometer Display */}
              <div className="mt-6 p-5 rounded-2xl bg-[#12151A] border border-white/10 text-center space-y-4">
                <div>
                  <span className="text-xs text-[#8A93A3] uppercase tracking-wider block mb-1">
                    {t('tools.nextServiceAtKm', 'Next Service Due At:')}
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white font-heading text-[#FF6A00]">
                    {result.nextDueKm.toLocaleString()} km
                  </div>
                  <span className="text-xs text-[#8A93A3] mt-0.5 block">
                    {result.remainingKm > 0
                      ? `${result.remainingKm.toLocaleString()} km remaining`
                      : `${Math.abs(result.remainingKm).toLocaleString()} km overdue`}
                  </span>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <span className="text-xs text-[#8A93A3] uppercase tracking-wider block mb-1">
                    {t('tools.nextServiceByDate', 'Or By Date:')}
                  </span>
                  <div className="text-lg sm:text-xl font-bold text-white font-heading text-[#FFC21A]">
                    {result.dueDate.toLocaleDateString(
                      i18n.language === 'ur' ? 'ur-PK' : 'en-PK',
                      { dateStyle: 'long' }
                    )}
                  </div>
                  <span className="text-xs text-[#8A93A3] mt-0.5 block">
                    {result.remainingDays > 0
                      ? `${result.remainingDays} days remaining`
                      : `${Math.abs(result.remainingDays)} days overdue`}
                  </span>
                </div>
              </div>

              {/* Metric Breakdown */}
              <div className="mt-6 space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-[#8A93A3]">{t('tools.selectedService', 'Service')}:</span>
                  <span className="text-white font-semibold">{localizedPresetName}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-[#8A93A3]">{t('tools.kmDrivenSince', 'Km Driven Since Last Service')}:</span>
                  <span className="text-white font-mono">{result.kmDrivenSinceService.toLocaleString()} km</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-[#8A93A3]">{t('tools.targetInterval', 'Configured Interval')}:</span>
                  <span className="text-white font-mono">
                    {targetKmInterval.toLocaleString()} km / {targetMonthsInterval} months
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate(`/book?service=${activePreset.serviceSlug}`)}
                  className="w-full justify-center"
                  rightIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
                >
                  {t('tools.bookThisServiceNow', 'Book This Service Now')}
                </Button>

                <Link to="/tools/cost-estimator" className="block text-center">
                  <span className="text-xs text-[#8A93A3] hover:text-[#FF6A00] transition-colors">
                    {t('tools.switchEstimatorLink', 'Need to estimate price? Try Cost Estimator →')}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
