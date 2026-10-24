import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  useVehicleFilter,
  type SelectedVehicleFilter,
} from './VehicleFilterContext';
import type { FuelType } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';

const FUEL_TYPES: FuelType[] = [
  'petrol',
  'diesel',
  'hybrid',
  'cng',
  'electric',
];

export function VehicleSelectorBar({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const {
    selectedVehicle,
    setSelectedVehicle,
    updateIncludeUniversal,
    clearVehicle,
    makes,
    models,
    savedVehicles,
    selectFromSavedVehicle,
  } = useVehicleFilter();

  const currentYear = new Date().getFullYear() + 1;
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear; y >= 1985; y--) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  const [isEditing, setIsEditing] = useState<boolean>(!selectedVehicle);
  const [makeId, setMakeId] = useState<string>(selectedVehicle?.makeId ?? '');
  const [modelId, setModelId] = useState<string>(selectedVehicle?.modelId ?? '');
  const [year, setYear] = useState<string>(
    selectedVehicle?.year ? String(selectedVehicle.year) : ''
  );
  const [fuelType, setFuelType] = useState<string>(selectedVehicle?.fuelType ?? '');
  const [includeUniversal, setIncludeUniversal] = useState<boolean>(
    selectedVehicle?.includeUniversal ?? true
  );

  // Sync local form state when selectedVehicle changes externally
  useEffect(() => {
    if (selectedVehicle) {
      setMakeId(selectedVehicle.makeId);
      setModelId(selectedVehicle.modelId ?? '');
      setYear(selectedVehicle.year ? String(selectedVehicle.year) : '');
      setFuelType(selectedVehicle.fuelType ?? '');
      setIncludeUniversal(selectedVehicle.includeUniversal);
      setIsEditing(false);
    } else {
      setMakeId('');
      setModelId('');
      setYear('');
      setFuelType('');
      setIncludeUniversal(true);
      setIsEditing(true);
    }
  }, [selectedVehicle]);

  const filteredModels = useMemo(() => {
    if (!makeId) return [];
    return models.filter((m) => m.make_id === makeId);
  }, [models, makeId]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!makeId) return;
    const makeObj = makes.find((m) => m.id === makeId);
    if (!makeObj) return;
    const modelObj = modelId ? models.find((m) => m.id === modelId) : null;

    const next: SelectedVehicleFilter = {
      makeId: makeObj.id,
      makeName: makeObj.name,
      modelId: modelObj?.id ?? null,
      modelName: modelObj?.name ?? null,
      year: year ? Number(year) : null,
      fuelType: (fuelType as FuelType) || null,
      includeUniversal,
    };
    setSelectedVehicle(next);
    setIsEditing(false);
  };

  const handleClear = () => {
    clearVehicle();
    setIsEditing(true);
  };

  const vehicleSummaryLabel = useMemo(() => {
    if (!selectedVehicle) return '';
    const parts: string[] = [selectedVehicle.makeName];
    if (selectedVehicle.modelName) parts.push(selectedVehicle.modelName);
    if (selectedVehicle.year) parts.push(String(selectedVehicle.year));
    if (selectedVehicle.fuelType) {
      parts.push(t(`booking.fuelTypes.${selectedVehicle.fuelType}`));
    }
    return parts.join(' ');
  }, [selectedVehicle, t]);

  return (
    <div
      className={cn(
        'rounded-2xl border transition-all',
        selectedVehicle
          ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border-emerald-500/40 text-white shadow-md'
          : 'bg-white border-slate-200/90 text-slate-900 shadow-sm',
        compact ? 'p-4' : 'p-5 sm:p-6',
        className
      )}
    >
      {/* Active Vehicle Banner State */}
      {selectedVehicle && !isEditing ? (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  {t('catalogue.vehicleBar.activeLabel')}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-xs font-medium text-slate-200">
                  <Car className="w-3.5 h-3.5 text-amber-400" />
                  {vehicleSummaryLabel}
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                {t('catalogue.vehicleBar.showingPartsFor', {
                  vehicle: vehicleSummaryLabel,
                })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-200 cursor-pointer select-none bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg border border-white/10">
              <input
                type="checkbox"
                checked={selectedVehicle.includeUniversal}
                onChange={(e) => updateIncludeUniversal(e.target.checked)}
                className="w-4 h-4 rounded border-slate-500 text-red-600 focus:ring-red-500"
              />
              <span>{t('catalogue.vehicleBar.includeUniversal')}</span>
            </label>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="border-slate-600 bg-slate-800/90 text-white hover:bg-slate-700"
            >
              {t('catalogue.vehicleBar.changeCar')}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-slate-300 hover:text-white hover:bg-white/10"
            >
              <RotateCcw className="w-4 h-4 me-1.5" />
              {t('catalogue.vehicleBar.clearCar')}
            </Button>
          </div>
        </div>
      ) : (
        /* Selector Form State */
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                  selectedVehicle
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-red-50 text-red-600 border border-red-100'
                )}
              >
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h2
                  className={cn(
                    'text-base sm:text-lg font-bold',
                    selectedVehicle ? 'text-white' : 'text-slate-900'
                  )}
                >
                  {t('catalogue.vehicleBar.title')}
                </h2>
                <p
                  className={cn(
                    'text-xs sm:text-sm',
                    selectedVehicle ? 'text-slate-300' : 'text-slate-600'
                  )}
                >
                  {t('catalogue.vehicleBar.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Saved Garage Quick Picker for Logged-in Users */}
              {savedVehicles.length > 0 && (
                <div className="relative">
                  <select
                    aria-label={t('catalogue.vehicleBar.chooseFromGarage')}
                    value=""
                    onChange={(e) => {
                      const chosen = savedVehicles.find((v) => v.id === e.target.value);
                      if (chosen) selectFromSavedVehicle(chosen);
                    }}
                    className={cn(
                      'text-xs sm:text-sm font-medium rounded-lg px-3 py-2 border focus:outline-none focus:ring-2 focus:ring-red-500',
                      selectedVehicle
                        ? 'bg-slate-800 border-slate-700 text-amber-300'
                        : 'bg-amber-50/80 border-amber-200 text-slate-900'
                    )}
                  >
                    <option value="">
                      ★ {t('catalogue.vehicleBar.chooseFromGarage')} (
                      {savedVehicles.length})
                    </option>
                    {savedVehicles.map((v) => {
                      const mk =
                        makes.find((m) => m.id === v.make_id)?.name || '';
                      const md =
                        models.find((m) => m.id === v.model_id)?.name ||
                        v.nickname ||
                        '';
                      return (
                        <option key={v.id} value={v.id}>
                          {mk} {md} {v.year ? `(${v.year})` : ''}{' '}
                          {v.plate_number ? `— ${v.plate_number}` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {selectedVehicle && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg"
                >
                  <ChevronUp className="w-4 h-4" />
                  {t('common.cancel')}
                </button>
              )}
            </div>
          </div>

          <form
            onSubmit={handleApply}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
          >
            {/* 1. Make */}
            <div>
              <label className="block text-xs font-medium mb-1 opacity-80">
                {t('catalogue.vehicleBar.make')} *
              </label>
              <select
                value={makeId}
                onChange={(e) => {
                  setMakeId(e.target.value);
                  setModelId('');
                }}
                required
                className={cn(
                  'w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500',
                  selectedVehicle
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                )}
              >
                <option value="">{t('catalogue.vehicleBar.selectMake')}</option>
                {makes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Model */}
            <div>
              <label className="block text-xs font-medium mb-1 opacity-80">
                {t('catalogue.vehicleBar.model')}
              </label>
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                disabled={!makeId}
                className={cn(
                  'w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50',
                  selectedVehicle
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                )}
              >
                <option value="">{t('catalogue.vehicleBar.allModels')}</option>
                {filteredModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Year */}
            <div>
              <label className="block text-xs font-medium mb-1 opacity-80">
                {t('catalogue.vehicleBar.year')}
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={!makeId}
                className={cn(
                  'w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50',
                  selectedVehicle
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                )}
              >
                <option value="">{t('catalogue.vehicleBar.anyYear')}</option>
                {years.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Fuel Type */}
            <div>
              <label className="block text-xs font-medium mb-1 opacity-80">
                {t('catalogue.vehicleBar.fuelType')}
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                disabled={!makeId}
                className={cn(
                  'w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50',
                  selectedVehicle
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                )}
              >
                <option value="">{t('catalogue.vehicleBar.anyFuel')}</option>
                {FUEL_TYPES.map((ft) => (
                  <option key={ft} value={ft}>
                    {t(`booking.fuelTypes.${ft}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Actions */}
            <div className="flex items-end gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={!makeId}
                className="w-full py-2.5"
              >
                <Sparkles className="w-4 h-4 me-1.5" />
                {t('catalogue.vehicleBar.findParts')}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
