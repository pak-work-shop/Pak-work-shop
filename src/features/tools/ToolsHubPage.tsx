import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calculator, CalendarClock, ArrowRight, ShieldCheck, Wrench, Sparkles } from 'lucide-react';
import { Seo } from '../../components/common/Seo';
import { Button } from '../../components/ui/Button';

export default function ToolsHubPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#0E1013] text-[#F5F6F8]">
      <Seo
        title={t('tools.hubPageTitle', 'Car Owner Tools & Calculators')}
        description={t(
          'tools.hubPageDescription',
          'Free automotive tools for Pakistani car owners: estimate repair costs tailored to your vehicle category, and calculate next service due dates.'
        )}
        canonicalPath="/tools"
      />

      {/* Header */}
      <section className="relative py-14 sm:py-20 border-b border-white/10 bg-gradient-to-b from-[#1B1F26] to-[#0E1013]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF6A00]/10 border border-[#FF6A00]/30 text-[#FF6A00] text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('tools.badge', 'Automotive Calculators')}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-white tracking-tight">
              {t('tools.heading', 'Free Workshop Tools & Calculators')}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#8A93A3] leading-relaxed">
              {t(
                'tools.subtitle',
                'Transparent pricing and proactive car care. Calculate maintenance schedules and get instant repair estimates customized for your car in Sadiqabad.'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Tool 1: Cost Estimator */}
          <div className="group relative bg-[#1B1F26] border border-white/10 rounded-2xl p-8 hover:border-[#FF6A00]/50 transition-all shadow-md flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-xl bg-[#FF6A00]/10 border border-[#FF6A00]/30 flex items-center justify-center text-[#FF6A00] mb-6 group-hover:scale-105 transition-transform">
                <Calculator className="w-7 h-7" />
              </div>

              <h2 className="text-2xl font-bold font-heading text-white group-hover:text-[#FF6A00] transition-colors mb-3">
                {t('tools.estimatorTitle', 'Repair & Maintenance Cost Estimator')}
              </h2>

              <p className="text-sm text-[#8A93A3] leading-relaxed mb-6">
                {t(
                  'tools.estimatorDesc',
                  'Select your vehicle make or car category (Hatchback, Sedan, SUV, Pickup, Van) and pick 1 to 6 workshop services to calculate an instant estimated price range in Pakistani Rupees.'
                )}
              </p>

              <ul className="space-y-2.5 mb-8 text-xs text-[#F5F6F8]">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#FF6A00]" />
                  <span>{t('tools.estimatorFeature1', 'Adjusted for Pakistani vehicle classes & engine sizes')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#FF6A00]" />
                  <span>{t('tools.estimatorFeature2', 'Per-service breakdown with labor and base rates')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#FF6A00]" />
                  <span>{t('tools.estimatorFeature3', 'Direct 1-click booking and WhatsApp quote generation')}</span>
                </li>
              </ul>
            </div>

            <div>
              <Link to="/tools/cost-estimator" className="block">
                <Button variant="primary" size="lg" className="w-full justify-center">
                  <span>{t('tools.launchEstimator', 'Calculate Estimate Now')}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Tool 2: Next Service Calculator */}
          <div className="group relative bg-[#1B1F26] border border-white/10 rounded-2xl p-8 hover:border-[#FFC21A]/50 transition-all shadow-md flex flex-col justify-between">
            <div>
              <div className="w-14 h-14 rounded-xl bg-[#FFC21A]/10 border border-[#FFC21A]/30 flex items-center justify-center text-[#FFC21A] mb-6 group-hover:scale-105 transition-transform">
                <CalendarClock className="w-7 h-7" />
              </div>

              <h2 className="text-2xl font-bold font-heading text-white group-hover:text-[#FFC21A] transition-colors mb-3">
                {t('tools.calculatorTitle', 'Next Service & Maintenance Calculator')}
              </h2>

              <p className="text-sm text-[#8A93A3] leading-relaxed mb-6">
                {t(
                  'tools.calculatorDesc',
                  'Never miss an oil change or critical brake inspection. Input your last service date and current odometer reading to calculate exact due km, due date, and urgency status.'
                )}
              </p>

              <ul className="space-y-2.5 mb-8 text-xs text-[#F5F6F8]">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#FFC21A]" />
                  <span>{t('tools.calculatorFeature1', 'Covers Engine Oil, General Service, Brakes, and Tyres')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#FFC21A]" />
                  <span>{t('tools.calculatorFeature2', 'Urgency badges: OK, Due Soon, or Overdue warning')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#FFC21A]" />
                  <span>{t('tools.calculatorFeature3', 'Client-side private calculation — zero personal data stored')}</span>
                </li>
              </ul>
            </div>

            <div>
              <Link to="/tools/next-service" className="block">
                <Button variant="secondary" size="lg" className="w-full justify-center">
                  <span>{t('tools.launchCalculator', 'Calculate Next Service')}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Helpful Advice Strip */}
        <div className="mt-12 bg-[#12151A] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-white/5 text-[#FF6A00] shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                {t('tools.adviceTitle', 'Need an In-Person Inspection at Our Sadiqabad Bay?')}
              </h3>
              <p className="text-xs sm:text-sm text-[#8A93A3] leading-relaxed">
                {t(
                  'tools.adviceDesc',
                  'Our certified mechanics provide a comprehensive 21-point vehicle safety inspection with computerized diagnostics.'
                )}
              </p>
            </div>
          </div>
          <Link to="/book" className="shrink-0">
            <Button variant="primary" size="md">
              {t('common.bookAppointment', 'Book Appointment')}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
