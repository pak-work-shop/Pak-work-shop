import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calculator,
  Car,
  Check,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  Layers,
  Phone,
  RefreshCw,
  Share2,
  Sparkles,
  Truck,
  Wrench,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { useAuth } from '../auth/useAuth';
import { useSiteSettings } from '../settings/useSiteSettings';
import { getLocalized } from '../../i18n/helpers';
import { Seo } from '../../components/common/Seo';
import { JsonLd } from '../../components/common/JsonLd';
import { Spinner } from '../../components/ui/Spinner';
import { Button } from '../../components/ui/Button';
import type {
  EstimatorRuleRow,
  ServiceRow,
  VehicleClass,
  VehicleMakeRow,
  VehicleModelRow,
  VehicleRow,
} from '../../types/database';

const DEFAULT_MULTIPLIERS: Record<VehicleClass, number> = {
  hatchback: 0.9,
  sedan: 1.0,
  suv: 1.3,
  pickup: 1.35,
  van: 1.25,
};

const VEHICLE_CLASSES: Array<{
  id: VehicleClass;
  icon: typeof Car;
  labelEn: string;
  labelUr: string;
  labelUrRoman: string;
  examples: string;
}> = [
  {
    id: 'hatchback',
    icon: Car,
    labelEn: 'Hatchback / Kei Car',
    labelUr: 'ہیچ بیک / چھوٹی کار',
    labelUrRoman: 'Hatchback / Chhoti Gaari',
    examples: 'Alto, Cultus, Wagon R, Vitz, Mira',
  },
  {
    id: 'sedan',
    icon: Car,
    labelEn: 'Sedan (Standard)',
    labelUr: 'سیڈان (معیاری کار)',
    labelUrRoman: 'Sedan (Standard Gaari)',
    examples: 'Corolla, Civic, Yaris, City, Alsvin',
  },
  {
    id: 'suv',
    icon: Truck,
    labelEn: 'SUV / Crossover',
    labelUr: 'ایس یو وی / کراس اوور',
    labelUrRoman: 'SUV / Crossover (4x4)',
    examples: 'Sportage, Tucson, Fortuner, BR-V, Prado',
  },
  {
    id: 'pickup',
    icon: Truck,
    labelEn: 'Pickup / Commercial',
    labelUr: 'پک اپ / کمرشل',
    labelUrRoman: 'Pickup / Commercial (4x4)',
    examples: 'Hilux Revo, D-Max, Shahzore',
  },
  {
    id: 'van',
    icon: Truck,
    labelEn: 'Van / Minivan',
    labelUr: 'وین / ایم پی وی',
    labelUrRoman: 'Van / Minivan / MPV',
    examples: 'Bolan, Every, Hijet, Hiace, Karvaan',
  },
];

export default function CostEstimatorPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState<boolean>(true);
  const [rules, setRules] = useState<EstimatorRuleRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [makes, setMakes] = useState<VehicleMakeRow[]>([]);
  const [models, setModels] = useState<VehicleModelRow[]>([]);
  const [userVehicles, setUserVehicles] = useState<VehicleRow[]>([]);

  // Selection states
  const [selectedClass, setSelectedClass] = useState<VehicleClass>('sedan');
  const [selectedMakeId, setSelectedMakeId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!env.isConfigured) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [rulesRes, srvRes, makeRes, modRes] = await Promise.all([
          supabase
            .from('estimator_rules')
            .select('*')
            .order('sort_order', { ascending: true }),
          supabase
            .from('services')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
          supabase
            .from('vehicle_makes')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true }),
          supabase
            .from('vehicle_models')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true }),
        ]);

        if (rulesRes.data && rulesRes.data.length > 0) {
          setRules(rulesRes.data);
        }
        if (srvRes.data) {
          setServices(srvRes.data);
          // Preselect service if query param exists
          const initialService = searchParams.get('service');
          if (initialService) {
            const found = srvRes.data.find((s) => s.slug === initialService);
            if (found) setSelectedServiceIds([found.id]);
          } else if (srvRes.data.length > 0) {
            // Default 1 popular service selected
            const defaultOil = srvRes.data.find((s) => s.slug.includes('oil'));
            if (defaultOil) {
              setSelectedServiceIds([defaultOil.id]);
            } else {
              setSelectedServiceIds([srvRes.data[0].id]);
            }
          }
        }
        if (makeRes.data) setMakes(makeRes.data);
        if (modRes.data) setModels(modRes.data);

        // If user logged in, load saved vehicles
        if (user) {
          const { data: vData } = await supabase
            .from('vehicles')
            .select('*')
            .eq('user_id', user.id);
          if (vData) setUserVehicles(vData);
        }
      } catch (err) {
        console.error('Failed to load cost estimator data:', err);
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [searchParams, user]);

  // When model selected, auto-update vehicle class if model has vehicle_class
  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    if (!modelId) return;
    const model = models.find((m) => m.id === modelId);
    if (model?.vehicle_class) {
      setSelectedClass(model.vehicle_class);
    }
  };

  // Quick fill from saved vehicle
  const handleSelectSavedVehicle = (v: VehicleRow) => {
    setSelectedMakeId(v.make_id);
    setSelectedModelId(v.model_id);
    const model = models.find((m) => m.id === v.model_id);
    if (model?.vehicle_class) {
      setSelectedClass(model.vehicle_class);
    }
  };

  const filteredModels = useMemo(() => {
    if (!selectedMakeId) return [];
    return models.filter((m) => m.make_id === selectedMakeId);
  }, [models, selectedMakeId]);

  // Class multiplier
  const currentMultiplier = useMemo(() => {
    const found = rules.find((r) => r.vehicle_class === selectedClass);
    return found ? Number(found.multiplier) : DEFAULT_MULTIPLIERS[selectedClass] || 1.0;
  }, [rules, selectedClass]);

  // Toggle service
  const handleToggleService = (serviceId: string) => {
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds(selectedServiceIds.filter((id) => id !== serviceId));
    } else {
      if (selectedServiceIds.length >= 6) {
        return; // Max 6 services
      }
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
    }
  };

  // Selected services objects
  const selectedServices = useMemo(() => {
    return services.filter((s) => selectedServiceIds.includes(s.id));
  }, [services, selectedServiceIds]);

  // Calculate totals
  const estimateCalculation = useMemo(() => {
    let minTotal = 0;
    let maxTotal = 0;
    let unpricedCount = 0;

    const breakdown = selectedServices.map((srv) => {
      const hasBase = srv.price_from !== null || srv.price_to !== null;
      if (!hasBase) {
        unpricedCount += 1;
        return {
          service: srv,
          hasPrice: false,
          minPrice: null,
          maxPrice: null,
        };
      }

      const rawMin = srv.price_from !== null ? Number(srv.price_from) : Number(srv.price_to);
      const rawMax = srv.price_to !== null ? Number(srv.price_to) : Number(srv.price_from);

      const adjMin = Math.round(rawMin * currentMultiplier);
      const adjMax = Math.round(rawMax * currentMultiplier);

      minTotal += adjMin;
      maxTotal += adjMax;

      return {
        service: srv,
        hasPrice: true,
        minPrice: adjMin,
        maxPrice: adjMax,
      };
    });

    return {
      breakdown,
      minTotal,
      maxTotal,
      unpricedCount,
    };
  }, [selectedServices, currentMultiplier]);

  const activeClassObj = useMemo(() => {
    return VEHICLE_CLASSES.find((c) => c.id === selectedClass) || VEHICLE_CLASSES[1];
  }, [selectedClass]);

  // Generate Booking Link
  const bookingUrl = useMemo(() => {
    if (selectedServices.length === 0) return '/book';
    const slugs = selectedServices.map((s) => s.slug).join(',');
    return `/book?service=${slugs}`;
  }, [selectedServices]);

  // WhatsApp estimate sharing
  const handleWhatsAppEstimate = () => {
    const phone = settings.whatsapp || settings.phone || '03126776844';
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const servicesListText = selectedServices
      .map((s) => `• ${getLocalized(s.name, 'en')}`)
      .join('\n');

    const estimateText =
      estimateCalculation.minTotal > 0
        ? `Estimated Range: Rs. ${estimateCalculation.minTotal.toLocaleString()} - Rs. ${estimateCalculation.maxTotal.toLocaleString()}`
        : 'Quote after physical inspection';

    const message = `Assalam-o-Alaikum Pak Auto Works, I calculated an estimate on your website:

Vehicle Class: ${activeClassObj.labelEn}
Selected Services:
${servicesListText}

${estimateText}

Please confirm technician availability at your Sadiqabad workshop. Thank you!`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const jsonLdData = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Pak Auto Works Repair Cost Estimator',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'All',
      url: `${origin}/tools/cost-estimator`,
      description:
        'Interactive car repair and maintenance cost estimation tool for Sadiqabad vehicle owners.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'PKR',
      },
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0E1013] text-[#F5F6F8]">
      <Seo
        title={t('tools.estimatorTitle', 'Car Repair & Maintenance Cost Estimator')}
        description={t(
          'tools.estimatorMetaDesc',
          'Calculate instant estimated costs for car services in Sadiqabad based on your car model and vehicle category. Transparent workshop pricing.'
        )}
        canonicalPath="/tools/cost-estimator"
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
              <span className="text-[#F5F6F8]">{t('tools.costEstimator', 'Cost Estimator')}</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6A00]/10 border border-[#FF6A00]/30 text-[#FF6A00] text-xs font-semibold uppercase tracking-wider mb-3">
              <Calculator className="w-3.5 h-3.5" />
              <span>{t('tools.calculatorBadge', 'Instant Estimate')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
              {t('tools.costEstimator', 'Workshop Service Cost Estimator')}
            </h1>

            <p className="mt-3 text-sm sm:text-base text-[#8A93A3] leading-relaxed">
              {t(
                'tools.estimatorSubtitle',
                'Select your vehicle type and check 1 to 6 services to calculate a realistic cost range in Pakistani Rupees.'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Main Estimator Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" label={t('common.loading')} />
            <p className="text-sm text-[#8A93A3]">{t('tools.loadingRules', 'Loading pricing data...')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Steps: Vehicle & Services Selection (Col 7) */}
            <div className="lg:col-span-7 space-y-8">
              {/* Step 1: Vehicle Selection */}
              <div className="bg-[#1B1F26] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#FF6A00] text-white text-xs font-bold flex items-center justify-center">
                      1
                    </span>
                    <h2 className="text-lg font-bold font-heading text-white">
                      {t('tools.step1Title', 'Select Vehicle Category or Model')}
                    </h2>
                  </div>
                  <span className="text-xs text-[#8A93A3]">
                    {t('tools.multiplierLabel', 'Class Multiplier')}: {currentMultiplier.toFixed(2)}x
                  </span>
                </div>

                {/* Saved Vehicles Quick Selection */}
                {userVehicles.length > 0 && (
                  <div className="mb-5 p-3 rounded-xl bg-[#12151A] border border-white/10">
                    <span className="text-xs text-[#8A93A3] block mb-2">
                      {t('tools.quickSelectSaved', 'Quick select from your saved garage:')}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {userVehicles.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleSelectSavedVehicle(v)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            selectedModelId === v.model_id
                              ? 'bg-[#FF6A00]/20 border-[#FF6A00] text-white font-semibold'
                              : 'bg-[#1B1F26] border-white/10 text-[#8A93A3] hover:text-white'
                          }`}
                        >
                          {v.nickname || `${v.year} Vehicle`} ({v.plate_number})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specific Make / Model Dropdown (Optional precision) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  <div>
                    <label className="block text-xs font-medium text-[#8A93A3] mb-1">
                      {t('booking.vehicleMake', 'Vehicle Make (Optional)')}
                    </label>
                    <select
                      value={selectedMakeId}
                      onChange={(e) => {
                        setSelectedMakeId(e.target.value);
                        setSelectedModelId('');
                      }}
                      className="w-full bg-[#12151A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF6A00]"
                    >
                      <option value="">{t('common.selectMake', 'Select Make (e.g. Toyota, Suzuki)')}</option>
                      {makes.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#8A93A3] mb-1">
                      {t('booking.vehicleModel', 'Vehicle Model (Optional)')}
                    </label>
                    <select
                      value={selectedModelId}
                      onChange={(e) => handleModelChange(e.target.value)}
                      disabled={!selectedMakeId}
                      className="w-full bg-[#12151A] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF6A00] disabled:opacity-50"
                    >
                      <option value="">{t('common.selectModel', 'Select Model (e.g. Corolla, Alto)')}</option>
                      {filteredModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Direct Vehicle Class Cards */}
                <label className="block text-xs font-semibold text-[#8A93A3] uppercase tracking-wider mb-2.5">
                  {t('tools.vehicleClassPrompt', 'Or Select Vehicle Class Directly:')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {VEHICLE_CLASSES.map((vc) => {
                    const isSelected = selectedClass === vc.id;
                    const Icon = vc.icon;
                    const label =
                      i18n.language === 'ur'
                        ? vc.labelUr
                        : i18n.language === 'ur-roman'
                        ? vc.labelUrRoman
                        : vc.labelEn;

                    return (
                      <button
                        key={vc.id}
                        type="button"
                        onClick={() => setSelectedClass(vc.id)}
                        className={`p-3.5 rounded-xl border text-start transition-all ${
                          isSelected
                            ? 'bg-[#FF6A00]/15 border-[#FF6A00] text-white shadow-sm ring-1 ring-[#FF6A00]'
                            : 'bg-[#12151A] border-white/10 text-[#8A93A3] hover:text-white hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-[#FF6A00]' : 'text-[#8A93A3]'}`} />
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#FF6A00]" />}
                        </div>
                        <div className="font-bold text-xs sm:text-sm text-white">{label}</div>
                        <div className="text-[10px] text-[#8A93A3] mt-1 truncate">{vc.examples}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Service Selection (1 to 6) */}
              <div className="bg-[#1B1F26] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#FF6A00] text-white text-xs font-bold flex items-center justify-center">
                      2
                    </span>
                    <h2 className="text-lg font-bold font-heading text-white">
                      {t('tools.step2Title', 'Select Services (1 to 6)')}
                    </h2>
                  </div>
                  <span className="text-xs font-medium text-[#FF6A00]">
                    {selectedServiceIds.length} / 6 {t('tools.selected', 'selected')}
                  </span>
                </div>

                <p className="text-xs text-[#8A93A3] mb-5">
                  {t(
                    'tools.step2Subtitle',
                    'Choose the repair or periodic maintenance packages you need estimated:'
                  )}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pe-1">
                  {services.map((srv) => {
                    const isChecked = selectedServiceIds.includes(srv.id);
                    const name = getLocalized(srv.name, i18n.language);
                    const hasBasePrice = srv.price_from !== null || srv.price_to !== null;

                    return (
                      <div
                        key={srv.id}
                        onClick={() => handleToggleService(srv.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                          isChecked
                            ? 'bg-[#FF6A00]/10 border-[#FF6A00] text-white ring-1 ring-[#FF6A00]'
                            : 'bg-[#12151A] border-white/10 text-[#8A93A3] hover:text-white hover:border-white/20'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                            isChecked
                              ? 'bg-[#FF6A00] border-[#FF6A00] text-white'
                              : 'border-white/30 bg-transparent'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-white leading-tight mb-1">
                            {name}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-[#8A93A3]">
                            {hasBasePrice ? (
                              <span className="text-[#FFC21A] font-semibold">
                                Rs. {Number(srv.price_from || srv.price_to).toLocaleString()}
                                {srv.price_to && srv.price_from !== srv.price_to
                                  ? ` - ${Number(srv.price_to).toLocaleString()}`
                                  : ''}
                              </span>
                            ) : (
                              <span className="text-[#8A93A3] italic">
                                {t('tools.quoteAfterInspection', 'Quote after inspection')}
                              </span>
                            )}
                            {srv.estimated_time && (
                              <span>• {getLocalized(srv.estimated_time, i18n.language)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Summary: Estimated Range & Actions (Col 5) */}
            <div className="lg:col-span-5 sticky top-24">
              <div className="bg-[#1B1F26] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-lg">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <h3 className="text-lg font-bold font-heading text-white">
                    {t('tools.estimateSummaryTitle', 'Cost Estimate Summary')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedServiceIds([]);
                      setSelectedClass('sedan');
                    }}
                    className="text-xs text-[#8A93A3] hover:text-[#FF6A00] flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{t('common.reset', 'Reset')}</span>
                  </button>
                </div>

                {/* Selected Vehicle Badge */}
                <div className="mt-4 p-3 rounded-xl bg-[#12151A] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-[#FF6A00]" />
                    <span className="text-xs text-white font-medium">
                      {activeClassObj.labelEn}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8A93A3] font-mono">
                    {currentMultiplier}x rate
                  </span>
                </div>

                {/* Calculated Range Hero Display */}
                <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-[#12151A] to-[#252B35] border border-white/10 text-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8A93A3] block mb-1">
                    {t('tools.estimatedRangeLabel', 'Estimated Price Range')}
                  </span>

                  {selectedServices.length === 0 ? (
                    <div className="py-4 text-xs text-[#8A93A3]">
                      {t('tools.noServicePrompt', 'Select at least 1 workshop service to see calculation.')}
                    </div>
                  ) : estimateCalculation.minTotal > 0 ? (
                    <div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-white font-heading text-[#FFC21A]">
                        Rs. {estimateCalculation.minTotal.toLocaleString()} – Rs.{' '}
                        {estimateCalculation.maxTotal.toLocaleString()}
                      </div>
                      <span className="text-[11px] text-[#8A93A3] mt-1 block">
                        PKR (Approx. parts + labor for {activeClassObj.labelEn})
                      </span>
                    </div>
                  ) : (
                    <div className="text-base font-bold text-[#FF6A00] py-2">
                      {t('tools.customQuoteInspection', 'Quote after physical inspection')}
                    </div>
                  )}
                </div>

                {/* Service Breakdown List */}
                {selectedServices.length > 0 && (
                  <div className="mt-6 space-y-2.5">
                    <span className="text-xs font-bold text-white uppercase tracking-wider block mb-2">
                      {t('tools.breakdownHeading', 'Service Breakdown')} ({selectedServices.length}):
                    </span>
                    {estimateCalculation.breakdown.map((item) => (
                      <div
                        key={item.service.id}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-white/5"
                      >
                        <span className="text-[#F5F6F8] truncate max-w-[200px]">
                          {getLocalized(item.service.name, i18n.language)}
                        </span>
                        {item.hasPrice ? (
                          <span className="text-[#FFC21A] font-medium shrink-0">
                            Rs. {item.minPrice?.toLocaleString()} - Rs. {item.maxPrice?.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[#8A93A3] italic shrink-0">
                            {t('tools.inspectionNeeded', 'Inspection required')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Disclaimer */}
                <div className="mt-6 p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5 text-[11px] text-[#8A93A3] leading-relaxed">
                  <Info className="w-4 h-4 text-[#FF6A00] shrink-0 mt-0.5" />
                  <span>
                    {t(
                      'tools.disclaimer',
                      'Estimate only. Exact quote is confirmed after physical inspection of part conditions, lubricant brand chosen, and actual labor at our Sadiqabad workshop.'
                    )}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={selectedServices.length === 0}
                    onClick={() => navigate(bookingUrl)}
                    className="w-full justify-center"
                    rightIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
                  >
                    {t('tools.bookTheseServices', 'Book These Services')}
                  </Button>

                  <Button
                    variant="secondary"
                    size="md"
                    disabled={selectedServices.length === 0}
                    onClick={handleWhatsAppEstimate}
                    className="w-full justify-center text-xs"
                    leftIcon={<Phone className="w-4 h-4 text-[#25D366]" />}
                  >
                    {t('tools.whatsAppEstimate', 'WhatsApp This Estimate')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
