import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  FlaskConical,
  MapPin,
  Plus,
  Save,
  Search,
  Tag,
  Trash2,
  Truck,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPKR } from '../../lib/format';
import { isMissingDatabaseObjectsError } from '../jobs/jobUtils';
import { DEFAULT_DELIVERY_SETTINGS } from '../orders/orderUtils';
import type {
  CouponDiscountType,
  CouponRow,
  DeliverySettingsRow,
  PakistanCityRow,
} from '../../types/database';
import { Seo } from '../../components/common/Seo';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';

export function AdminDeliveryCouponsPage() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'delivery' | 'coupons' | 'cities'>(
    'delivery'
  );
  const [schemaMissing, setSchemaMissing] = useState(false);

  // 1. Delivery Settings State
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [flatRate, setFlatRate] = useState<string>('300');
  const [freeCitiesText, setFreeCitiesText] = useState<string>('Sadiqabad');
  const [freeOverAmount, setFreeOverAmount] = useState<string>('');
  const [minOrderAmount, setMinOrderAmount] = useState<string>('0');
  const [codEnabled, setCodEnabled] = useState<boolean>(true);
  const [codMaxAmount, setCodMaxAmount] = useState<string>('');
  const [codBlockedCitiesText, setCodBlockedCitiesText] = useState<string>('');
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] =
    useState<boolean>(false);

  // 2. Coupons State
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponRow | null>(null);
  const [confirmDeleteCoupon, setConfirmDeleteCoupon] =
    useState<CouponRow | null>(null);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [deletingCoupon, setDeletingCoupon] = useState(false);

  // Coupon Form State
  const [cCode, setCCode] = useState('');
  const [cType, setCType] = useState<CouponDiscountType>('percent');
  const [cValue, setCValue] = useState('10');
  const [cMinOrder, setCMinOrder] = useState('0');
  const [cMaxDiscount, setCMaxDiscount] = useState('');
  const [cStartsAt, setCStartsAt] = useState('');
  const [cExpiresAt, setCExpiresAt] = useState('');
  const [cUsageLimit, setCUsageLimit] = useState('');
  const [cIsActive, setCIsActive] = useState(true);

  // 3. Pakistan Cities State
  const [cities, setCities] = useState<PakistanCityRow[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citySearch, setCitySearch] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [newCityProvince, setNewCityProvince] = useState('Punjab');
  const [addingCity, setAddingCity] = useState(false);

  const loadAll = useCallback(async () => {
    setSettingsLoading(true);
    setCouponsLoading(true);
    setCitiesLoading(true);

    try {
      const [dsRes, cpRes, ctRes] = await Promise.all([
        supabase
          .from('delivery_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle(),
        supabase
          .from('coupons')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('pakistan_cities')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
      ]);

      if (dsRes.error && isMissingDatabaseObjectsError(dsRes.error)) {
        setSchemaMissing(true);
        return;
      }

      setSchemaMissing(false);
      const ds = (dsRes.data ??
        DEFAULT_DELIVERY_SETTINGS) as DeliverySettingsRow;
      setFlatRate(String(ds.flat_rate ?? 300));
      setFreeCitiesText(
        (ds.free_cities && ds.free_cities.length > 0
          ? ds.free_cities
          : ['Sadiqabad']
        ).join(', ')
      );
      setFreeOverAmount(
        ds.free_over_amount !== null && ds.free_over_amount !== undefined
          ? String(ds.free_over_amount)
          : ''
      );
      setMinOrderAmount(String(ds.min_order_amount ?? 0));
      setCodEnabled(Boolean(ds.cod_enabled));
      setCodMaxAmount(
        ds.cod_max_amount !== null && ds.cod_max_amount !== undefined
          ? String(ds.cod_max_amount)
          : ''
      );
      setCodBlockedCitiesText((ds.cod_blocked_cities ?? []).join(', '));
      setOnlinePaymentEnabled(Boolean(ds.online_payment_enabled));

      if (!cpRes.error && cpRes.data) {
        setCoupons(cpRes.data as CouponRow[]);
      }
      if (!ctRes.error && ctRes.data) {
        setCities(ctRes.data as PakistanCityRow[]);
      }
    } finally {
      setSettingsLoading(false);
      setCouponsLoading(false);
      setCitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleSaveDeliverySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedFlat = Number(flatRate);
    const parsedMin = Number(minOrderAmount);
    if (Number.isNaN(parsedFlat) || parsedFlat < 0) {
      toast.error(t('validation.priceNonNegative'));
      return;
    }

    const freeCitiesArr = freeCitiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const blockedCitiesArr = codBlockedCitiesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('delivery_settings')
        .update({
          flat_rate: parsedFlat,
          free_cities: freeCitiesArr,
          free_over_amount:
            freeOverAmount.trim() !== '' ? Number(freeOverAmount) : null,
          min_order_amount: Number.isNaN(parsedMin) ? 0 : parsedMin,
          cod_enabled: codEnabled,
          cod_max_amount:
            codMaxAmount.trim() !== '' ? Number(codMaxAmount) : null,
          cod_blocked_cities: blockedCitiesArr,
          online_payment_enabled: onlinePaymentEnabled,
        })
        .eq('id', 1);

      if (error) {
        toast.error(t('admin.delivery.saveError'));
        return;
      }

      toast.success(t('admin.delivery.savedSuccess'));
      await loadAll();
    } finally {
      setSavingSettings(false);
    }
  };

  const openCreateCouponModal = () => {
    setEditingCoupon(null);
    setCCode('');
    setCType('percent');
    setCValue('10');
    setCMinOrder('0');
    setCMaxDiscount('');
    setCStartsAt('');
    setCExpiresAt('');
    setCUsageLimit('');
    setCIsActive(true);
    setCouponModalOpen(true);
  };

  const openEditCouponModal = (cp: CouponRow) => {
    setEditingCoupon(cp);
    setCCode(cp.code);
    setCType(cp.discount_type);
    setCValue(String(cp.value));
    setCMinOrder(String(cp.min_order ?? 0));
    setCMaxDiscount(
      cp.max_discount !== null && cp.max_discount !== undefined
        ? String(cp.max_discount)
        : ''
    );
    setCStartsAt(cp.starts_at ? cp.starts_at.slice(0, 10) : '');
    setCExpiresAt(cp.expires_at ? cp.expires_at.slice(0, 10) : '');
    setCUsageLimit(
      cp.usage_limit !== null && cp.usage_limit !== undefined
        ? String(cp.usage_limit)
        : ''
    );
    setCIsActive(cp.is_active);
    setCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = cCode.trim().toUpperCase();
    const numValue = Number(cValue);
    if (!/^[A-Z0-9_-]{3,25}$/.test(cleanCode)) {
      toast.error(t('admin.coupons.invalidCodeError'));
      return;
    }
    if (Number.isNaN(numValue) || numValue <= 0) {
      toast.error(t('validation.amountPositive'));
      return;
    }
    if (cType === 'percent' && numValue > 100) {
      toast.error(t('admin.coupons.percentMaxError'));
      return;
    }

    setSavingCoupon(true);
    try {
      const payload = {
        code: cleanCode,
        discount_type: cType,
        value: numValue,
        min_order: cMinOrder.trim() !== '' ? Number(cMinOrder) : 0,
        max_discount: cMaxDiscount.trim() !== '' ? Number(cMaxDiscount) : null,
        starts_at: cStartsAt ? new Date(cStartsAt).toISOString() : null,
        expires_at: cExpiresAt ? new Date(cExpiresAt).toISOString() : null,
        usage_limit:
          cUsageLimit.trim() !== '' ? Math.round(Number(cUsageLimit)) : null,
        is_active: cIsActive,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(payload)
          .eq('id', editingCoupon.id);
        if (error) {
          toast.error(t('admin.coupons.saveError'));
          return;
        }
        toast.success(t('admin.coupons.updatedSuccess'));
      } else {
        const { error } = await supabase.from('coupons').insert(payload);
        if (error) {
          toast.error(t('admin.coupons.saveError'));
          return;
        }
        toast.success(t('admin.coupons.createdSuccess'));
      }

      setCouponModalOpen(false);
      await loadAll();
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleDeleteCoupon = async () => {
    if (!confirmDeleteCoupon) return;
    setDeletingCoupon(true);
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', confirmDeleteCoupon.id);
      if (error) {
        toast.error(t('admin.coupons.deleteError'));
        return;
      }
      toast.success(t('admin.coupons.deletedSuccess'));
      setConfirmDeleteCoupon(null);
      await loadAll();
    } finally {
      setDeletingCoupon(false);
    }
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCityName.trim();
    if (cleanName.length < 2) return;
    setAddingCity(true);
    try {
      const { error } = await supabase.from('pakistan_cities').insert({
        name: cleanName,
        province: newCityProvince,
        sort_order: 50,
        is_active: true,
      });
      if (error) {
        toast.error(t('admin.delivery.citySaveError'));
        return;
      }
      toast.success(t('admin.delivery.cityAddedSuccess'));
      setNewCityName('');
      await loadAll();
    } finally {
      setAddingCity(false);
    }
  };

  const handleToggleCityActive = async (city: PakistanCityRow) => {
    const { error } = await supabase
      .from('pakistan_cities')
      .update({ is_active: !city.is_active })
      .eq('id', city.id);
    if (!error) {
      setCities((prev) =>
        prev.map((c) =>
          c.id === city.id ? { ...c, is_active: !c.is_active } : c
        )
      );
    }
  };

  const filteredCities = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.province || '').toLowerCase().includes(q)
    );
  }, [cities, citySearch]);

  return (
    <div className="space-y-6 text-start">
      <Seo title={`${t('admin.delivery.title')} — Admin`} />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white heading-accent mb-2">
          {t('admin.delivery.title')}
        </h1>
        <p className="text-xs sm:text-sm text-[#8A93A3]">
          {t('admin.delivery.subtitle')}
        </p>
      </div>

      {schemaMissing ? (
        <Card className="p-6 border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#FFC21A] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">
              {t('common.databaseSetupNeededTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-[#F5F6F8]/85">
              {t('common.databaseSetupNeededDesc')}
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Section Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('delivery')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'delivery'
                  ? 'bg-[#FF6A00] text-white'
                  : 'bg-[#1B1F26] text-[#8A93A3] hover:text-white border border-white/10'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>{t('admin.delivery.tabs.deliveryRules')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('coupons')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'coupons'
                  ? 'bg-[#FF6A00] text-white'
                  : 'bg-[#1B1F26] text-[#8A93A3] hover:text-white border border-white/10'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>
                {t('admin.delivery.tabs.coupons')} ({coupons.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cities')}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'cities'
                  ? 'bg-[#FF6A00] text-white'
                  : 'bg-[#1B1F26] text-[#8A93A3] hover:text-white border border-white/10'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>
                {t('admin.delivery.tabs.cities')} ({cities.length})
              </span>
            </button>
          </div>

          {/* TAB 1: DELIVERY RULES & COD SETTINGS */}
          {activeTab === 'delivery' && (
            <Card className="p-6 space-y-6">
              {settingsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <form
                  onSubmit={handleSaveDeliverySettings}
                  className="space-y-6"
                >
                  {/* Live Rule Preview Banner */}
                  <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm space-y-1">
                      <p className="font-bold text-white">
                        {t('admin.delivery.liveRulePreviewTitle')}
                      </p>
                      <p className="text-emerald-200/90">
                        {t('admin.delivery.liveRulePreviewBody', {
                          freeCities: freeCitiesText || 'Sadiqabad',
                          flatRate: formatPKR(Number(flatRate) || 300),
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label={t('admin.delivery.fields.flatRate')}
                      type="number"
                      dir="ltr"
                      value={flatRate}
                      onChange={(e) => setFlatRate(e.target.value)}
                      hint={t('admin.delivery.fields.flatRateHint')}
                    />

                    <Input
                      label={t('admin.delivery.fields.freeCities')}
                      value={freeCitiesText}
                      onChange={(e) => setFreeCitiesText(e.target.value)}
                      placeholder="Sadiqabad"
                      hint={t('admin.delivery.fields.freeCitiesHint')}
                    />

                    <Input
                      label={t('admin.delivery.fields.freeOverAmount')}
                      type="number"
                      dir="ltr"
                      value={freeOverAmount}
                      onChange={(e) => setFreeOverAmount(e.target.value)}
                      placeholder="Optional (e.g. 15000)"
                      hint={t('admin.delivery.fields.freeOverAmountHint')}
                    />

                    <Input
                      label={t('admin.delivery.fields.minOrderAmount')}
                      type="number"
                      dir="ltr"
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(e.target.value)}
                      hint={t('admin.delivery.fields.minOrderAmountHint')}
                    />
                  </div>

                  <div className="border-t border-white/10 pt-5 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#FFC21A]">
                      {t('admin.delivery.codSectionTitle')}
                    </h3>

                    <label className="flex items-center gap-2.5 text-sm text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={codEnabled}
                        onChange={(e) => setCodEnabled(e.target.checked)}
                        className="rounded border-white/20 text-[#FF6A00] focus:ring-[#FF6A00]"
                      />
                      <span>{t('admin.delivery.fields.codEnabled')}</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label={t('admin.delivery.fields.codMaxAmount')}
                        type="number"
                        dir="ltr"
                        value={codMaxAmount}
                        onChange={(e) => setCodMaxAmount(e.target.value)}
                        placeholder="Optional (e.g. 100000)"
                        hint={t('admin.delivery.fields.codMaxAmountHint')}
                      />

                      <Input
                        label={t('admin.delivery.fields.codBlockedCities')}
                        value={codBlockedCitiesText}
                        onChange={(e) =>
                          setCodBlockedCitiesText(e.target.value)
                        }
                        placeholder="Comma-separated cities (if any)"
                      />
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-5 space-y-2">
                    <label className="flex items-center gap-2.5 text-sm text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onlinePaymentEnabled}
                        onChange={(e) =>
                          setOnlinePaymentEnabled(e.target.checked)
                        }
                        className="rounded border-white/20 text-[#FF6A00] focus:ring-[#FF6A00]"
                      />
                      <span>
                        {t('admin.delivery.fields.onlinePaymentEnabled')}
                      </span>
                    </label>
                    <p className="text-xs text-[#8A93A3]">
                      {t('admin.delivery.fields.onlinePaymentHint')}
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={savingSettings}
                      leftIcon={<Save className="w-4 h-4" />}
                    >
                      {t('admin.delivery.saveSettingsBtn')}
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          )}

          {/* TAB 2: DISCOUNT COUPONS */}
          {activeTab === 'coupons' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs sm:text-sm text-[#8A93A3]">
                  {t('admin.coupons.securityNote')}
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={openCreateCouponModal}
                >
                  {t('admin.coupons.addBtn')}
                </Button>
              </div>

              {couponsLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : coupons.length === 0 ? (
                <EmptyState
                  title={t('admin.coupons.emptyTitle')}
                  description={t('admin.coupons.emptyDesc')}
                  action={
                    <Button
                      type="button"
                      variant="primary"
                      leftIcon={<Plus className="w-4 h-4" />}
                      onClick={openCreateCouponModal}
                    >
                      {t('admin.coupons.addBtn')}
                    </Button>
                  }
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coupons.map((cp) => {
                    const isExpired =
                      cp.expires_at &&
                      new Date(cp.expires_at).getTime() < Date.now();
                    return (
                      <Card
                        key={cp.id}
                        className="p-5 flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                dir="ltr"
                                className="font-mono text-lg font-extrabold text-[#FFC21A] bg-[#0E1013] border border-white/10 rounded px-2.5 py-0.5"
                              >
                                {cp.code}
                              </span>
                              <Badge
                                variant={
                                  !cp.is_active || isExpired
                                    ? 'neutral'
                                    : 'success'
                                }
                              >
                                {!cp.is_active
                                  ? t('admin.servicesAdmin.statusInactive')
                                  : isExpired
                                    ? t('admin.coupons.expiredBadge')
                                    : t('admin.servicesAdmin.statusActive')}
                              </Badge>
                              {cp.is_demo && (
                                <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[11px] font-semibold text-[#FFC21A]">
                                  <FlaskConical className="w-3 h-3" />
                                  <span>{t('demo.badge')}</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => openEditCouponModal(cp)}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={() => setConfirmDeleteCoupon(cp)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>

                          <div className="text-sm font-bold text-white">
                            {cp.discount_type === 'percent'
                              ? `${cp.value}% OFF`
                              : `${formatPKR(cp.value)} OFF`}
                            {cp.max_discount
                              ? ` (${t('admin.coupons.maxCap')}: ${formatPKR(cp.max_discount)})`
                              : ''}
                          </div>

                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8A93A3]">
                            <span>
                              {t('admin.coupons.minOrderLabel')}:{' '}
                              <strong className="text-white">
                                {formatPKR(cp.min_order)}
                              </strong>
                            </span>
                            <span dir="ltr">
                              {t('admin.coupons.usageLabel')}:{' '}
                              <strong className="text-white">
                                {cp.used_count}
                                {cp.usage_limit ? ` / ${cp.usage_limit}` : ''}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PAKISTAN CITIES DIRECTORY */}
          {activeTab === 'cities' && (
            <div className="space-y-4">
              <Card className="p-4 flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-[#8A93A3] absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder={t('admin.delivery.searchCitiesPlaceholder')}
                    className="ps-9"
                  />
                </div>

                <form
                  onSubmit={handleAddCity}
                  className="flex flex-wrap items-end gap-2"
                >
                  <Input
                    value={newCityName}
                    onChange={(e) => setNewCityName(e.target.value)}
                    placeholder={t('admin.delivery.newCityPlaceholder')}
                    className="w-44"
                  />
                  <Select
                    value={newCityProvince}
                    onChange={(e) => setNewCityProvince(e.target.value)}
                    options={[
                      { value: 'Punjab', label: 'Punjab' },
                      { value: 'Sindh', label: 'Sindh' },
                      {
                        value: 'Khyber Pakhtunkhwa',
                        label: 'Khyber Pakhtunkhwa',
                      },
                      { value: 'Balochistan', label: 'Balochistan' },
                      {
                        value: 'Islamabad Capital Territory',
                        label: 'Islamabad',
                      },
                      { value: 'Azad Kashmir', label: 'Azad Kashmir' },
                      { value: 'Gilgit-Baltistan', label: 'Gilgit-Baltistan' },
                    ]}
                    className="w-44"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={addingCity}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    {t('admin.delivery.addCityBtn')}
                  </Button>
                </form>
              </Card>

              {citiesLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <Card className="p-4 max-h-[520px] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {filteredCities.map((city) => (
                      <div
                        key={city.id}
                        className="rounded bg-[#0E1013] border border-white/10 px-3 py-2 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="truncate">
                          <span className="font-semibold text-white block truncate">
                            {city.name}
                          </span>
                          <span className="text-[10px] text-[#8A93A3]">
                            {city.province}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleToggleCityActive(city)}
                          className={`rounded px-2 py-0.5 text-[10px] font-bold cursor-pointer ${
                            city.is_active
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/5 text-[#8A93A3] border border-white/10'
                          }`}
                        >
                          {city.is_active
                            ? t('admin.servicesAdmin.statusActive')
                            : t('admin.servicesAdmin.statusInactive')}
                        </button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal: Create / Edit Coupon */}
      <Modal
        isOpen={couponModalOpen}
        onClose={() => setCouponModalOpen(false)}
        title={
          editingCoupon
            ? t('admin.coupons.editModalTitle')
            : t('admin.coupons.createModalTitle')
        }
      >
        <form onSubmit={handleSaveCoupon} className="space-y-4 text-start">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`${t('admin.coupons.codeLabel')} *`}
              dir="ltr"
              value={cCode}
              onChange={(e) => setCCode(e.target.value.toUpperCase())}
              placeholder="WELCOME10"
            />

            <Select
              label={t('admin.coupons.typeLabel')}
              value={cType}
              onChange={(e) => setCType(e.target.value as CouponDiscountType)}
              options={[
                {
                  value: 'percent',
                  label: t('admin.coupons.typePercent'),
                },
                {
                  value: 'fixed',
                  label: t('admin.coupons.typeFixed'),
                },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label={`${t('admin.coupons.valueLabel')} *`}
              type="number"
              dir="ltr"
              value={cValue}
              onChange={(e) => setCValue(e.target.value)}
            />

            <Input
              label={t('admin.coupons.minOrderLabel')}
              type="number"
              dir="ltr"
              value={cMinOrder}
              onChange={(e) => setCMinOrder(e.target.value)}
            />

            <Input
              label={t('admin.coupons.maxDiscountLabel')}
              type="number"
              dir="ltr"
              value={cMaxDiscount}
              onChange={(e) => setCMaxDiscount(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label={t('admin.coupons.startsAtLabel')}
              type="date"
              dir="ltr"
              value={cStartsAt}
              onChange={(e) => setCStartsAt(e.target.value)}
            />

            <Input
              label={t('admin.coupons.expiresAtLabel')}
              type="date"
              dir="ltr"
              value={cExpiresAt}
              onChange={(e) => setCExpiresAt(e.target.value)}
            />

            <Input
              label={t('admin.coupons.usageLimitLabel')}
              type="number"
              dir="ltr"
              value={cUsageLimit}
              onChange={(e) => setCUsageLimit(e.target.value)}
              placeholder="Unlimited"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
            <input
              type="checkbox"
              checked={cIsActive}
              onChange={(e) => setCIsActive(e.target.checked)}
              className="rounded border-white/20 text-[#FF6A00] focus:ring-[#FF6A00]"
            />
            <span>{t('admin.coupons.activeToggleLabel')}</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCouponModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={savingCoupon}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Coupon Confirmation */}
      <Modal
        isOpen={Boolean(confirmDeleteCoupon)}
        onClose={() => setConfirmDeleteCoupon(null)}
        title={t('admin.coupons.deleteConfirmTitle')}
      >
        <div className="space-y-4 text-start">
          <p className="text-sm text-[#8A93A3]">
            {t('admin.coupons.deleteConfirmDesc', {
              code: confirmDeleteCoupon?.code ?? '',
            })}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeleteCoupon(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={deletingCoupon}
              onClick={handleDeleteCoupon}
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
