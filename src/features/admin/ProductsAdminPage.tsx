import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Car,
  Edit3,
  FlaskConical,
  History,
  Image as ImageIcon,
  Layers,
  Minus,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  Wrench,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { getLocalized } from '../../i18n/helpers';
import type {
  BrandRow,
  FuelType,
  LanguageCode,
  LocalizedText,
  PartOrigin,
  ProductCategoryRow,
  ProductImageRow,
  ProductRow,
  ProductSpecItem,
  ProductVehicleRow,
  ServiceRow,
  StockMovementReason,
  StockMovementRow,
  VehicleMakeRow,
  VehicleModelRow,
} from '../../types/database';
import {
  calculateDiscountPercent,
  formatProductPKR,
  isPhase5MissingError,
} from '../catalogue/useCatalogueData';
import { CategoryIllustration } from '../catalogue/CategoryIllustration';
import { notifyAdminProductsUpdated } from './AdminSidebar';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
  Textarea,
} from '../../components/ui';
import { Seo } from '../../components/common/Seo';
import { ImageField } from '../../components/common/ImageField';
import { cn } from '../../lib/utils';

const LANG_TABS: ReadonlyArray<{ code: LanguageCode; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'ur', label: 'اردو' },
  { code: 'ur-roman', label: 'Roman Urdu' },
];

const PART_ORIGIN_OPTIONS: ReadonlyArray<PartOrigin> = [
  'genuine_oem',
  'japanese_imported',
  'aftermarket',
  'local',
];

const STOCK_REASONS: ReadonlyArray<StockMovementReason> = [
  'restock',
  'manual_adjustment',
  'used_in_job',
  'damaged',
  'order_reserved',
  'order_cancelled',
  'initial',
];

const FUEL_OPTIONS: ReadonlyArray<FuelType> = [
  'petrol',
  'diesel',
  'hybrid',
  'cng',
  'electric',
];

type EditorTab = 'general' | 'pricing_specs' | 'images' | 'compatibility';

type DraftImageItem = {
  id?: string;
  url: string;
  alt: string;
  sort_order: number;
  is_primary: boolean;
};

type DraftVehicleRow = {
  id?: string;
  make_id: string;
  model_id: string;
  year_from: string;
  year_to: string;
  fuel_type: string;
  notes: string;
};

function slugifyText(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function emptyLocalized(): LocalizedText {
  return { en: '', ur: '', 'ur-roman': '' };
}

export default function ProductsAdminPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Reference data
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<ProductCategoryRow[]>([]);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [primaryImagesMap, setPrimaryImagesMap] = useState<
    Record<string, string>
  >({});
  const [makes, setMakes] = useState<VehicleMakeRow[]>([]);
  const [models, setModels] = useState<VehicleModelRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [schemaMissing, setSchemaMissing] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>(
    () => searchParams.get('stock') || 'all'
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Stock Adjust Modal state
  const [adjustProduct, setAdjustProduct] = useState<ProductRow | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<string>('1');
  const [adjustReason, setAdjustReason] =
    useState<StockMovementReason>('restock');
  const [adjustNote, setAdjustNote] = useState<string>('');
  const [adjustSaving, setAdjustSaving] = useState<boolean>(false);

  // Stock Movement History Modal state
  const [historyProduct, setHistoryProduct] = useState<ProductRow | null>(null);
  const [movements, setMovements] = useState<StockMovementRow[]>([]);
  const [loadingMovements, setLoadingMovements] = useState<boolean>(false);

  // Delete Modal state
  const [deletingProduct, setDeletingProduct] = useState<ProductRow | null>(
    null
  );
  const [deleting, setDeleting] = useState<boolean>(false);

  // Create / Edit Product Modal state
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [editorTab, setEditorTab] = useState<EditorTab>('general');
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [langTab, setLangTab] = useState<LanguageCode>('en');
  const [savingProduct, setSavingProduct] = useState<boolean>(false);

  // Form fields
  const [sku, setSku] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [nameMap, setNameMap] = useState<LocalizedText>(emptyLocalized());
  const [shortDescMap, setShortDescMap] =
    useState<LocalizedText>(emptyLocalized());
  const [descMap, setDescMap] = useState<LocalizedText>(emptyLocalized());
  const [categoryId, setCategoryId] = useState<string>('');
  const [brandId, setBrandId] = useState<string>('');
  const [partOrigin, setPartOrigin] = useState<PartOrigin>('aftermarket');
  const [price, setPrice] = useState<string>('0');
  const [compareAtPrice, setCompareAtPrice] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [initialStockQty, setInitialStockQty] = useState<string>('0');
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('3');
  const [warranty, setWarranty] = useState<string>('');
  const [isUniversal, setIsUniversal] = useState<boolean>(false);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [specs, setSpecs] = useState<ProductSpecItem[]>([]);
  const [draftImages, setDraftImages] = useState<DraftImageItem[]>([]);
  const [newImageUploadUrl, setNewImageUploadUrl] = useState<string>('');
  const [newImageAlt, setNewImageAlt] = useState<string>('');
  const [draftVehicles, setDraftVehicles] = useState<DraftVehicleRow[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const loadCatalogue = useCallback(async () => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [
        prodRes,
        catRes,
        brandRes,
        imgRes,
        makesRes,
        modelsRes,
        srvRes,
      ] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('product_categories')
          .select('*')
          .order('sort_order', { ascending: true }),
        supabase.from('brands').select('*').order('name', { ascending: true }),
        supabase
          .from('product_images')
          .select('*')
          .order('is_primary', { ascending: false })
          .order('sort_order', { ascending: true }),
        supabase
          .from('vehicle_makes')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('vehicle_models')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
      ]);

      if (prodRes.error) {
        if (isPhase5MissingError(prodRes.error)) {
          setSchemaMissing(true);
        } else {
          toast.error(prodRes.error.message);
        }
        setProducts([]);
        return;
      }

      setSchemaMissing(false);
      setProducts((prodRes.data ?? []) as ProductRow[]);
      if (!catRes.error && catRes.data) {
        setCategories(catRes.data as ProductCategoryRow[]);
      }
      if (!brandRes.error && brandRes.data) {
        setBrands(brandRes.data as BrandRow[]);
      }
      if (!imgRes.error && imgRes.data) {
        const map: Record<string, string> = {};
        for (const img of imgRes.data as ProductImageRow[]) {
          if (!map[img.product_id]) {
            map[img.product_id] = img.url;
          }
        }
        setPrimaryImagesMap(map);
      }
      if (!makesRes.error && makesRes.data) {
        setMakes(makesRes.data as VehicleMakeRow[]);
      }
      if (!modelsRes.error && modelsRes.data) {
        setModels(modelsRes.data as VehicleModelRow[]);
      }
      if (!srvRes.error && srvRes.data) {
        setServices(srvRes.data as ServiceRow[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalogue();
  }, [loadCatalogue]);

  const categoriesById = useMemo(() => {
    const map: Record<string, ProductCategoryRow> = {};
    for (const c of categories) {
      map[c.id] = c;
    }
    return map;
  }, [categories]);

  const brandsById = useMemo(() => {
    const map: Record<string, BrandRow> = {};
    for (const b of brands) {
      map[b.id] = b;
    }
    return map;
  }, [brands]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (q) {
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchSlug = p.slug.toLowerCase().includes(q);
        const matchEn = (p.name?.en ?? '').toLowerCase().includes(q);
        const matchUr = (p.name?.ur ?? '').toLowerCase().includes(q);
        const matchRo = (p.name?.['ur-roman'] ?? '').toLowerCase().includes(q);
        if (!matchSku && !matchSlug && !matchEn && !matchUr && !matchRo) {
          return false;
        }
      }
      if (categoryFilter !== 'all' && p.category_id !== categoryFilter) {
        return false;
      }
      if (brandFilter !== 'all' && p.brand_id !== brandFilter) {
        return false;
      }
      if (stockFilter === 'in_stock' && p.stock_qty <= p.low_stock_threshold) {
        return false;
      }
      if (
        stockFilter === 'low_stock' &&
        (p.stock_qty <= 0 || p.stock_qty > p.low_stock_threshold)
      ) {
        return false;
      }
      if (stockFilter === 'out_of_stock' && p.stock_qty > 0) {
        return false;
      }
      if (
        stockFilter === 'alert' &&
        p.stock_qty > p.low_stock_threshold
      ) {
        return false;
      }
      if (statusFilter === 'active' && !p.is_active) {
        return false;
      }
      if (statusFilter === 'inactive' && p.is_active) {
        return false;
      }
      return true;
    });
  }, [
    products,
    searchQuery,
    categoryFilter,
    brandFilter,
    stockFilter,
    statusFilter,
  ]);

  // Quick stock adjustment modal opener
  const openAdjustStockModal = (
    product: ProductRow,
    presetDelta = 1,
    presetReason: StockMovementReason = 'restock'
  ) => {
    setAdjustProduct(product);
    setAdjustDelta(String(presetDelta));
    setAdjustReason(presetReason);
    setAdjustNote('');
  };

  const handleConfirmAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct) return;

    const deltaNum = parseInt(adjustDelta, 10);
    if (!Number.isFinite(deltaNum) || deltaNum === 0) {
      toast.error(t('admin.products.stock.invalidDelta'));
      return;
    }

    if (adjustProduct.stock_qty + deltaNum < 0) {
      toast.error(t('admin.products.stock.negativeResultError'));
      return;
    }

    setAdjustSaving(true);
    try {
      const { error } = await supabase.rpc('admin_adjust_stock', {
        p_product_id: adjustProduct.id,
        p_delta: deltaNum,
        p_reason: adjustReason,
        p_note: adjustNote.trim() || null,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(t('admin.products.stock.adjustedToast'));
      setAdjustProduct(null);
      notifyAdminProductsUpdated();
      await loadCatalogue();
    } finally {
      setAdjustSaving(false);
    }
  };

  const openMovementHistory = async (product: ProductRow) => {
    setHistoryProduct(product);
    setLoadingMovements(true);
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        toast.error(error.message);
        setMovements([]);
        return;
      }
      setMovements((data ?? []) as StockMovementRow[]);
    } finally {
      setLoadingMovements(false);
    }
  };

  const openCreateEditor = () => {
    setEditingProduct(null);
    setEditorTab('general');
    setLangTab('en');
    setSku('');
    setSlug('');
    setNameMap(emptyLocalized());
    setShortDescMap(emptyLocalized());
    setDescMap(emptyLocalized());
    setCategoryId(categories[0]?.id ?? '');
    setBrandId('');
    setPartOrigin('aftermarket');
    setPrice('0');
    setCompareAtPrice('');
    setCostPrice('');
    setInitialStockQty('0');
    setLowStockThreshold('3');
    setWarranty('');
    setIsUniversal(false);
    setIsFeatured(false);
    setIsActive(true);
    setSpecs([]);
    setDraftImages([]);
    setNewImageUploadUrl('');
    setNewImageAlt('');
    setDraftVehicles([]);
    setSelectedServiceIds([]);
    setEditorOpen(true);
  };

  const openEditEditor = async (product: ProductRow) => {
    setEditingProduct(product);
    setEditorTab('general');
    setLangTab('en');
    setSku(product.sku);
    setSlug(product.slug);
    setNameMap({
      en: product.name?.en ?? '',
      ur: product.name?.ur ?? '',
      'ur-roman': product.name?.['ur-roman'] ?? '',
    });
    setShortDescMap({
      en: product.short_description?.en ?? '',
      ur: product.short_description?.ur ?? '',
      'ur-roman': product.short_description?.['ur-roman'] ?? '',
    });
    setDescMap({
      en: product.description?.en ?? '',
      ur: product.description?.ur ?? '',
      'ur-roman': product.description?.['ur-roman'] ?? '',
    });
    setCategoryId(product.category_id ?? '');
    setBrandId(product.brand_id ?? '');
    setPartOrigin(product.part_origin);
    setPrice(String(product.price ?? 0));
    setCompareAtPrice(
      product.compare_at_price !== null && product.compare_at_price !== undefined
        ? String(product.compare_at_price)
        : ''
    );
    setCostPrice(
      product.cost_price !== null && product.cost_price !== undefined
        ? String(product.cost_price)
        : ''
    );
    setInitialStockQty(String(product.stock_qty ?? 0));
    setLowStockThreshold(String(product.low_stock_threshold ?? 3));
    setWarranty(product.warranty ?? '');
    setIsUniversal(product.is_universal);
    setIsFeatured(product.is_featured);
    setIsActive(product.is_active);
    setSpecs(Array.isArray(product.specs) ? product.specs : []);
    setNewImageUploadUrl('');
    setNewImageAlt('');
    setEditorOpen(true);

    // Load images, compatibility rows, and linked services
    const [imgRes, vehRes, srvLinkRes] = await Promise.all([
      supabase
        .from('product_images')
        .select('*')
        .eq('product_id', product.id)
        .order('is_primary', { ascending: false })
        .order('sort_order', { ascending: true }),
      supabase
        .from('product_vehicles')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('product_services')
        .select('service_id')
        .eq('product_id', product.id),
    ]);

    if (!imgRes.error && imgRes.data) {
      setDraftImages(
        (imgRes.data as ProductImageRow[]).map((im) => ({
          id: im.id,
          url: im.url,
          alt: im.alt ?? '',
          sort_order: im.sort_order,
          is_primary: im.is_primary,
        }))
      );
    } else {
      setDraftImages([]);
    }

    if (!vehRes.error && vehRes.data) {
      setDraftVehicles(
        (vehRes.data as ProductVehicleRow[]).map((v) => ({
          id: v.id,
          make_id: v.make_id,
          model_id: v.model_id ?? '',
          year_from: v.year_from ? String(v.year_from) : '',
          year_to: v.year_to ? String(v.year_to) : '',
          fuel_type: v.fuel_type ?? '',
          notes: v.notes ?? '',
        }))
      );
    } else {
      setDraftVehicles([]);
    }

    if (!srvLinkRes.error && srvLinkRes.data) {
      setSelectedServiceIds(
        (srvLinkRes.data as Array<{ service_id: string }>).map(
          (r) => r.service_id
        )
      );
    } else {
      setSelectedServiceIds([]);
    }
  };

  const handleNameChange = (lang: LanguageCode, val: string) => {
    setNameMap((prev) => ({ ...prev, [lang]: val }));
    if (lang === 'en' && !editingProduct) {
      setSlug(slugifyText(val));
    }
  };

  const handleAddSpecRow = () => {
    setSpecs((prev) => [
      ...prev,
      { label: emptyLocalized(), value: emptyLocalized() },
    ]);
  };

  const handleRemoveSpecRow = (idx: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddDraftImage = () => {
    const cleanUrl = newImageUploadUrl.trim();
    if (!cleanUrl) return;
    setDraftImages((prev) => [
      ...prev,
      {
        url: cleanUrl,
        alt: newImageAlt.trim() || nameMap.en || sku,
        sort_order: prev.length,
        is_primary: prev.length === 0,
      },
    ]);
    setNewImageUploadUrl('');
    setNewImageAlt('');
  };

  const handleSetPrimaryImage = (idx: number) => {
    setDraftImages((prev) =>
      prev.map((im, i) => ({
        ...im,
        is_primary: i === idx,
      }))
    );
  };

  const handleRemoveDraftImage = (idx: number) => {
    setDraftImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length > 0 && !next.some((im) => im.is_primary)) {
        next[0] = { ...next[0], is_primary: true };
      }
      return next;
    });
  };

  const handleAddVehicleRow = () => {
    setDraftVehicles((prev) => [
      ...prev,
      {
        make_id: makes[0]?.id ?? '',
        model_id: '',
        year_from: '',
        year_to: '',
        fuel_type: '',
        notes: '',
      },
    ]);
  };

  const handleRemoveVehicleRow = (idx: number) => {
    setDraftVehicles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleToggleServiceLink = (srvId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(srvId)
        ? prev.filter((id) => id !== srvId)
        : [...prev, srvId]
    );
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSku = sku.trim().toUpperCase();
    const cleanNameEn = (nameMap.en ?? '').trim();
    const cleanSlug = slugifyText(slug || cleanNameEn);
    const numPrice = Number(price);
    const numCompare =
      compareAtPrice.trim() !== '' ? Number(compareAtPrice) : null;
    const numCost = costPrice.trim() !== '' ? Number(costPrice) : null;
    const numThreshold = Math.max(0, parseInt(lowStockThreshold, 10) || 3);

    if (!cleanSku || !cleanNameEn || !cleanSlug) {
      toast.error(t('admin.products.validation.requiredFields'));
      setEditorTab('general');
      return;
    }

    if (!Number.isFinite(numPrice) || numPrice < 0) {
      toast.error(t('admin.products.validation.invalidPrice'));
      setEditorTab('pricing_specs');
      return;
    }

    if (numCompare !== null && numCompare > 0 && numCompare <= numPrice) {
      toast.error(t('admin.products.validation.comparePriceMustExceedPrice'));
      setEditorTab('pricing_specs');
      return;
    }

    // Validate vehicle year ranges
    for (const v of draftVehicles) {
      if (!v.make_id) continue;
      const yf = v.year_from.trim() ? parseInt(v.year_from, 10) : null;
      const yt = v.year_to.trim() ? parseInt(v.year_to, 10) : null;
      if (yf !== null && yt !== null && yt < yf) {
        toast.error(t('admin.products.validation.invalidYearRange'));
        setEditorTab('compatibility');
        return;
      }
    }

    setSavingProduct(true);
    try {
      const cleanedSpecs = specs.filter(
        (sp) =>
          (sp.label.en ?? '').trim() !== '' || (sp.value.en ?? '').trim() !== ''
      );

      const cleanShortEn = (shortDescMap.en ?? '').trim();
      const cleanDescEn = (descMap.en ?? '').trim();

      const basePayload = {
        sku: cleanSku,
        slug: cleanSlug,
        name: {
          en: cleanNameEn,
          ur: (nameMap.ur ?? '').trim() || cleanNameEn,
          'ur-roman': (nameMap['ur-roman'] ?? '').trim() || cleanNameEn,
        },
        short_description: {
          en: cleanShortEn,
          ur: (shortDescMap.ur ?? '').trim() || cleanShortEn,
          'ur-roman': (shortDescMap['ur-roman'] ?? '').trim() || cleanShortEn,
        },
        description: {
          en: cleanDescEn,
          ur: (descMap.ur ?? '').trim() || cleanDescEn,
          'ur-roman': (descMap['ur-roman'] ?? '').trim() || cleanDescEn,
        },
        specs: cleanedSpecs,
        category_id: categoryId || null,
        brand_id: brandId || null,
        part_origin: partOrigin,
        price: numPrice,
        compare_at_price: numCompare && numCompare > 0 ? numCompare : null,
        cost_price: numCost !== null && numCost >= 0 ? numCost : null,
        low_stock_threshold: numThreshold,
        warranty: warranty.trim() || null,
        is_universal: isUniversal,
        is_featured: isFeatured,
        is_active: isActive,
      };

      let targetProductId = editingProduct?.id ?? '';

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(basePayload)
          .eq('id', editingProduct.id);

        if (error) {
          toast.error(error.message);
          return;
        }
      } else {
        const startStock = Math.max(0, parseInt(initialStockQty, 10) || 0);
        const { data, error } = await supabase
          .from('products')
          .insert({
            ...basePayload,
            stock_qty: 0,
          })
          .select('id')
          .single();

        if (error || !data) {
          toast.error(error?.message || 'Failed to create product');
          return;
        }
        targetProductId = (data as { id: string }).id;

        if (startStock > 0) {
          await supabase.rpc('admin_adjust_stock', {
            p_product_id: targetProductId,
            p_delta: startStock,
            p_reason: 'initial',
            p_note: 'Initial stock on product creation',
          });
        }
      }

      // Sync product_images
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', targetProductId);

      if (draftImages.length > 0) {
        const imageRows = draftImages.map((im, idx) => ({
          product_id: targetProductId,
          url: im.url,
          alt: im.alt || cleanNameEn,
          sort_order: idx,
          is_primary: im.is_primary,
        }));
        await supabase.from('product_images').insert(imageRows);
      }

      // Sync product_vehicles
      await supabase
        .from('product_vehicles')
        .delete()
        .eq('product_id', targetProductId);

      const validVehicles = draftVehicles.filter((v) => Boolean(v.make_id));
      if (!isUniversal && validVehicles.length > 0) {
        const vehRows = validVehicles.map((v) => ({
          product_id: targetProductId,
          make_id: v.make_id,
          model_id: v.model_id || null,
          year_from: v.year_from.trim() ? parseInt(v.year_from, 10) : null,
          year_to: v.year_to.trim() ? parseInt(v.year_to, 10) : null,
          fuel_type: (v.fuel_type || null) as FuelType | null,
          notes: v.notes.trim() || null,
        }));
        await supabase.from('product_vehicles').insert(vehRows);
      }

      // Sync product_services
      await supabase
        .from('product_services')
        .delete()
        .eq('product_id', targetProductId);

      if (selectedServiceIds.length > 0) {
        const srvRows = selectedServiceIds.map((srvId) => ({
          product_id: targetProductId,
          service_id: srvId,
        }));
        await supabase.from('product_services').insert(srvRows);
      }

      toast.success(
        editingProduct
          ? t('admin.products.updatedToast')
          : t('admin.products.createdToast')
      );
      setEditorOpen(false);
      notifyAdminProductsUpdated();
      await loadCatalogue();
    } finally {
      setSavingProduct(false);
    }
  };

  const handleToggleField = async (
    product: ProductRow,
    field: 'is_active' | 'is_featured'
  ) => {
    const nextVal = !product[field];
    const updatePayload =
      field === 'is_active' ? { is_active: nextVal } : { is_featured: nextVal };
    const { error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', product.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    notifyAdminProductsUpdated();
    await loadCatalogue();
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deletingProduct.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(t('admin.products.deletedToast'));
      setDeletingProduct(null);
      notifyAdminProductsUpdated();
      await loadCatalogue();
    } finally {
      setDeleting(false);
    }
  };

  const liveDiscountPreview = calculateDiscountPercent(
    Number(price) || 0,
    compareAtPrice.trim() ? Number(compareAtPrice) : null
  );

  return (
    <div className="space-y-6 text-start">
      <Seo title={t('admin.products.title')} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white heading-accent mb-2">
            {t('admin.products.title')}
          </h1>
          <p className="text-sm text-[#8A93A3]">
            {t('admin.products.subtitle')}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openCreateEditor}
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={schemaMissing}
        >
          {t('admin.products.addProduct')}
        </Button>
      </div>

      {schemaMissing && (
        <Card className="p-5 border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#FFC21A] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-white">
              {t('shop.schemaMissingTitle')}
            </h2>
            <p className="text-xs text-[#F5F6F8]/85">
              {t('shop.schemaMissingDescription')}
            </p>
          </div>
        </Card>
      )}

      {/* Search & Filter Bar */}
      <Card className="p-4 border-white/10 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-[#8A93A3] absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('admin.products.searchPlaceholder')}
              className="w-full rounded-md bg-[#0E1013] border border-white/15 ps-10 pe-3 py-2 text-sm text-white placeholder:text-[#8A93A3] focus:outline-none focus:border-[#FF6A00]"
            />
          </div>

          <Select
            label=""
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: 'all', label: t('admin.products.allCategories') },
              ...categories.map((c) => ({
                value: c.id,
                label: getLocalized(c, 'name', i18n.language),
              })),
            ]}
          />

          <Select
            label=""
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            options={[
              { value: 'all', label: t('admin.products.allBrands') },
              ...brands.map((b) => ({
                value: b.id,
                label: b.name,
              })),
            ]}
          />

          <Select
            label=""
            value={stockFilter}
            onChange={(e) => {
              const val = e.target.value;
              setStockFilter(val);
              if (val === 'all') {
                searchParams.delete('stock');
              } else {
                searchParams.set('stock', val);
              }
              setSearchParams(searchParams, { replace: true });
            }}
            options={[
              { value: 'all', label: t('admin.products.stockFilter.all') },
              {
                value: 'in_stock',
                label: t('admin.products.stockFilter.inStock'),
              },
              {
                value: 'low_stock',
                label: t('admin.products.stockFilter.lowStock'),
              },
              {
                value: 'out_of_stock',
                label: t('admin.products.stockFilter.outOfStock'),
              },
              {
                value: 'alert',
                label: t('admin.products.stockFilter.alert'),
              },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10 text-xs text-[#8A93A3]">
          <div className="flex items-center gap-2">
            <span>{t('admin.products.statusFilterLabel')}:</span>
            {(['all', 'active', 'inactive'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer',
                  statusFilter === st
                    ? 'bg-[#FF6A00] text-white'
                    : 'bg-[#0E1013] text-[#8A93A3] hover:text-white'
                )}
              >
                {t(`admin.products.statusFilter.${st}`)}
              </button>
            ))}
          </div>

          <span>
            {t('shop.resultsShowing', { count: filteredProducts.length })}
          </span>
        </div>
      </Card>

      {/* Products List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-24 w-full bg-[#1B1F26]" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Package className="w-6 h-6" />}
          title={t('admin.products.emptyTitle')}
          description={t('admin.products.emptyDescription')}
          action={
            !schemaMissing ? (
              <Button
                variant="primary"
                onClick={openCreateEditor}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {t('admin.products.addProduct')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((prod) => {
            const pName = getLocalized(prod, 'name', i18n.language);
            const cat = prod.category_id
              ? categoriesById[prod.category_id]
              : undefined;
            const brand = prod.brand_id ? brandsById[prod.brand_id] : undefined;
            const primaryImg = primaryImagesMap[prod.id];
            const discountPct = calculateDiscountPercent(
              prod.price,
              prod.compare_at_price
            );
            const isOut = prod.stock_qty <= 0;
            const isLow =
              prod.stock_qty > 0 &&
              prod.stock_qty <= prod.low_stock_threshold;

            return (
              <Card
                key={prod.id}
                className="p-4 border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Thumbnail + Product Identity */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-[#0E1013] border border-white/10 shrink-0">
                      {primaryImg ? (
                        <img
                          src={primaryImg}
                          alt={pName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <CategoryIllustration
                          categorySlug={cat?.slug}
                          title={pName}
                          className="w-full h-full"
                        />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          dir="ltr"
                          className="text-xs font-mono font-bold text-[#FFC21A]"
                        >
                          {prod.sku}
                        </span>
                        <h2 className="text-base font-bold font-heading text-white truncate">
                          {pName}
                        </h2>
                        {prod.is_demo && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                            <FlaskConical className="w-2.5 h-2.5" />
                            <span>{t('demo.badge')}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#8A93A3]">
                        {cat && (
                          <span>
                            {getLocalized(cat, 'name', i18n.language)}
                          </span>
                        )}
                        {brand && (
                          <>
                            <span>•</span>
                            <span className="text-[#F5F6F8] font-medium">
                              {brand.name}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{t(`shop.origin.${prod.part_origin}`)}</span>
                        {prod.is_universal && (
                          <>
                            <span>•</span>
                            <span className="text-sky-400">
                              {t('shop.compatibility.universalFit')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Price, Stock Quick Controls & Actions */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10">
                    {/* Price */}
                    <div className="text-start lg:text-end">
                      <div
                        dir="ltr"
                        className="text-base font-bold font-heading text-white tabular-nums"
                      >
                        {formatProductPKR(prod.price)}
                      </div>
                      {prod.compare_at_price &&
                        prod.compare_at_price > prod.price && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <span
                              dir="ltr"
                              className="text-[#8A93A3] line-through tabular-nums"
                            >
                              {formatProductPKR(prod.compare_at_price)}
                            </span>
                            {discountPct > 0 && (
                              <span className="text-[#FF6A00] font-bold">
                                -{discountPct}%
                              </span>
                            )}
                          </div>
                        )}
                    </div>

                    {/* Stock Badge + Quick Adjust */}
                    <div className="flex items-center gap-2 bg-[#0E1013] border border-white/10 rounded-md px-3 py-1.5">
                      <Badge
                        variant={
                          isOut ? 'danger' : isLow ? 'warning' : 'success'
                        }
                      >
                        {isOut
                          ? t('shop.stock.outOfStock')
                          : isLow
                            ? t('shop.stock.lowStockCount', {
                                count: prod.stock_qty,
                              })
                            : `${prod.stock_qty} ${t('shop.stock.inStock')}`}
                      </Badge>

                      <button
                        type="button"
                        onClick={() =>
                          openAdjustStockModal(
                            prod,
                            -1,
                            'manual_adjustment'
                          )
                        }
                        disabled={prod.stock_qty <= 0}
                        title={t('admin.products.stock.decrement')}
                        className="p-1 rounded bg-[#1B1F26] hover:bg-[#2A2F38] text-[#F5F6F8] disabled:opacity-40 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openAdjustStockModal(prod, 1, 'restock')
                        }
                        title={t('admin.products.stock.increment')}
                        className="p-1 rounded bg-[#1B1F26] hover:bg-[#2A2F38] text-[#F5F6F8] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openMovementHistory(prod)}
                        title={t('admin.products.stock.historyTitle')}
                        className="p-1 rounded bg-[#1B1F26] hover:bg-[#2A2F38] text-[#8A93A3] hover:text-white cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Featured & Active toggles */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          void handleToggleField(prod, 'is_featured')
                        }
                        title={t('admin.products.featuredLabel')}
                        className={cn(
                          'p-2 rounded-md border transition-colors cursor-pointer',
                          prod.is_featured
                            ? 'bg-[#FFC21A]/15 border-[#FFC21A]/40 text-[#FFC21A]'
                            : 'bg-[#0E1013] border-white/10 text-[#8A93A3] hover:text-white'
                        )}
                      >
                        <Star className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleToggleField(prod, 'is_active')
                        }
                        className={cn(
                          'px-2.5 py-1.5 rounded-md border text-xs font-semibold transition-colors cursor-pointer',
                          prod.is_active
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                            : 'bg-white/5 border-white/10 text-[#8A93A3]'
                        )}
                      >
                        {prod.is_active
                          ? t('admin.common.active')
                          : t('admin.common.inactive')}
                      </button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void openEditEditor(prod)}
                        leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                      >
                        {t('common.edit')}
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeletingProduct(prod)}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={Boolean(adjustProduct)}
        onClose={() => !adjustSaving && setAdjustProduct(null)}
        title={t('admin.products.stock.adjustTitle')}
        size="md"
      >
        {adjustProduct && (
          <form
            onSubmit={(e) => void handleConfirmAdjustStock(e)}
            className="space-y-4"
          >
            <div className="rounded-md bg-[#0E1013] border border-white/10 p-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-[#FFC21A]">
                  {adjustProduct.sku}
                </p>
                <p className="text-sm font-bold text-white">
                  {getLocalized(adjustProduct, 'name', i18n.language)}
                </p>
              </div>
              <div className="text-end">
                <span className="text-xs text-[#8A93A3] block">
                  {t('admin.products.stock.currentQty')}
                </span>
                <span
                  dir="ltr"
                  className="text-lg font-bold font-heading text-white tabular-nums"
                >
                  {adjustProduct.stock_qty}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('admin.products.stock.deltaLabel')}
                type="number"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(e.target.value)}
                dir="ltr"
                required
              />

              <Select
                label={t('admin.products.stock.reasonLabel')}
                value={adjustReason}
                onChange={(e) =>
                  setAdjustReason(e.target.value as StockMovementReason)
                }
                options={STOCK_REASONS.map((r) => ({
                  value: r,
                  label: t(`admin.products.stock.reasons.${r}`),
                }))}
              />
            </div>

            <div className="rounded-md bg-[#0E1013] border border-white/10 p-3 flex items-center justify-between text-xs">
              <span className="text-[#8A93A3]">
                {t('admin.products.stock.resultingStock')}:
              </span>
              <span
                dir="ltr"
                className={cn(
                  'font-bold text-sm tabular-nums',
                  adjustProduct.stock_qty + (parseInt(adjustDelta, 10) || 0) < 0
                    ? 'text-[#EF4444]'
                    : 'text-emerald-400'
                )}
              >
                {adjustProduct.stock_qty + (parseInt(adjustDelta, 10) || 0)}
              </span>
            </div>

            <Input
              label={t('admin.products.stock.noteLabel')}
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              placeholder={t('admin.products.stock.notePlaceholder')}
            />

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAdjustProduct(null)}
                disabled={adjustSaving}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={adjustSaving}
              >
                {t('admin.products.stock.applyAdjustment')}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Stock Movement History Modal */}
      <Modal
        isOpen={Boolean(historyProduct)}
        onClose={() => setHistoryProduct(null)}
        title={t('admin.products.stock.historyTitle')}
        size="lg"
      >
        {historyProduct && (
          <div className="space-y-4">
            <div className="rounded-md bg-[#0E1013] border border-white/10 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-[#FFC21A]">
                  {historyProduct.sku}
                </span>
                <h3 className="text-sm font-bold text-white">
                  {getLocalized(historyProduct, 'name', i18n.language)}
                </h3>
              </div>
              <Badge variant="neutral">
                {t('admin.products.stock.currentQty')}:{' '}
                {historyProduct.stock_qty}
              </Badge>
            </div>

            {loadingMovements ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full bg-[#0E1013]" />
                <Skeleton className="h-12 w-full bg-[#0E1013]" />
              </div>
            ) : movements.length === 0 ? (
              <p className="text-xs text-[#8A93A3] py-6 text-center">
                {t('admin.products.stock.noMovements')}
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pe-1">
                {movements.map((mv) => (
                  <div
                    key={mv.id}
                    className="rounded-md bg-[#0E1013] border border-white/10 p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={mv.delta > 0 ? 'success' : 'danger'}
                        >
                          <span dir="ltr">
                            {mv.delta > 0 ? `+${mv.delta}` : mv.delta}
                          </span>
                        </Badge>
                        <span className="font-semibold text-white">
                          {t(`admin.products.stock.reasons.${mv.reason}`)}
                        </span>
                      </div>
                      {mv.note && (
                        <p className="text-[#8A93A3] pt-0.5">{mv.note}</p>
                      )}
                    </div>
                    <span
                      dir="ltr"
                      className="text-[11px] text-[#8A93A3] tabular-nums shrink-0"
                    >
                      {new Date(mv.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Product Create / Edit 4-Tab Modal */}
      <Modal
        isOpen={editorOpen}
        onClose={() => !savingProduct && setEditorOpen(false)}
        title={
          editingProduct
            ? t('admin.products.editProduct')
            : t('admin.products.addProduct')
        }
        size="xl"
      >
        <form onSubmit={(e) => void handleSaveProduct(e)} className="space-y-5">
          {/* Editor Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 pb-3">
            {(
              [
                {
                  id: 'general',
                  label: t('admin.products.tabs.general'),
                  icon: Layers,
                },
                {
                  id: 'pricing_specs',
                  label: t('admin.products.tabs.pricingSpecs'),
                  icon: SlidersHorizontal,
                },
                {
                  id: 'images',
                  label: t('admin.products.tabs.images'),
                  icon: ImageIcon,
                },
                {
                  id: 'compatibility',
                  label: t('admin.products.tabs.compatibility'),
                  icon: Car,
                },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEditorTab(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer',
                    editorTab === tab.id
                      ? 'bg-[#FF6A00] text-white'
                      : 'bg-[#0E1013] text-[#8A93A3] hover:text-white'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: General & Localized Content */}
          {editorTab === 'general' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                {LANG_TABS.map((tab) => (
                  <button
                    key={tab.code}
                    type="button"
                    onClick={() => setLangTab(tab.code)}
                    className={cn(
                      'px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer',
                      langTab === tab.code
                        ? 'bg-[#FFC21A] text-[#0E1013]'
                        : 'bg-[#0E1013] text-[#8A93A3] hover:text-white'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <Input
                label={`${t('admin.products.fields.name')} (${langTab.toUpperCase()})`}
                value={nameMap[langTab]}
                onChange={(e) => handleNameChange(langTab, e.target.value)}
                dir={langTab === 'ur' ? 'rtl' : 'ltr'}
                required={langTab === 'en'}
              />

              <Input
                label={`${t('admin.products.fields.shortDescription')} (${langTab.toUpperCase()})`}
                value={shortDescMap[langTab]}
                onChange={(e) =>
                  setShortDescMap((prev) => ({
                    ...prev,
                    [langTab]: e.target.value,
                  }))
                }
                dir={langTab === 'ur' ? 'rtl' : 'ltr'}
              />

              <Textarea
                label={`${t('admin.products.fields.description')} (${langTab.toUpperCase()})`}
                value={descMap[langTab]}
                onChange={(e) =>
                  setDescMap((prev) => ({
                    ...prev,
                    [langTab]: e.target.value,
                  }))
                }
                dir={langTab === 'ur' ? 'rtl' : 'ltr'}
                rows={3}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('admin.products.fields.sku')}
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  dir="ltr"
                  placeholder="PAW-OIL-001"
                  required
                />
                <Input
                  label={t('admin.products.fields.slug')}
                  value={slug}
                  onChange={(e) => setSlug(slugifyText(e.target.value))}
                  dir="ltr"
                  placeholder="paw-synthetic-5w30-4l"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label={t('admin.products.fields.category')}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  options={[
                    { value: '', label: t('admin.products.unassigned') },
                    ...categories.map((c) => ({
                      value: c.id,
                      label: getLocalized(c, 'name', i18n.language),
                    })),
                  ]}
                />

                <Select
                  label={t('admin.products.fields.brand')}
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  options={[
                    { value: '', label: t('admin.products.unassigned') },
                    ...brands.map((b) => ({
                      value: b.id,
                      label: b.name,
                    })),
                  ]}
                />

                <Select
                  label={t('admin.products.fields.partOrigin')}
                  value={partOrigin}
                  onChange={(e) => setPartOrigin(e.target.value as PartOrigin)}
                  options={PART_ORIGIN_OPTIONS.map((origin) => ({
                    value: origin,
                    label: t(`shop.origin.${origin}`),
                  }))}
                />
              </div>

              <Input
                label={t('admin.products.fields.warranty')}
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                placeholder="6 Months / 10,000 km Warranty"
              />

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-white/20 bg-[#0E1013] text-[#FF6A00]"
                  />
                  <span className="text-sm text-white">
                    {t('admin.products.fields.isActive')}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-white/20 bg-[#0E1013] text-[#FF6A00]"
                  />
                  <span className="text-sm text-white">
                    {t('admin.products.fields.isFeatured')}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUniversal}
                    onChange={(e) => setIsUniversal(e.target.checked)}
                    className="rounded border-white/20 bg-[#0E1013] text-[#FF6A00]"
                  />
                  <span className="text-sm text-white">
                    {t('admin.products.fields.isUniversal')}
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: Pricing, Stock & Specs */}
          {editorTab === 'pricing_specs' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label={t('admin.products.fields.pricePkr')}
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  dir="ltr"
                  required
                />
                <Input
                  label={t('admin.products.fields.compareAtPricePkr')}
                  type="number"
                  min={0}
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  dir="ltr"
                  placeholder="Optional MRP"
                />
                <Input
                  label={t('admin.products.fields.costPricePkr')}
                  type="number"
                  min={0}
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  dir="ltr"
                  placeholder="Admin-only cost"
                />
              </div>

              {liveDiscountPreview > 0 && (
                <div className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs text-emerald-300 font-semibold">
                  {t('shop.savePercent', { percent: liveDiscountPreview })} (
                  {formatProductPKR(Number(price))} vs{' '}
                  {formatProductPKR(Number(compareAtPrice))})
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!editingProduct ? (
                  <Input
                    label={t('admin.products.fields.initialStock')}
                    type="number"
                    min={0}
                    value={initialStockQty}
                    onChange={(e) => setInitialStockQty(e.target.value)}
                    dir="ltr"
                  />
                ) : (
                  <div className="rounded-md bg-[#0E1013] border border-white/10 p-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#8A93A3] block">
                        {t('admin.products.stock.currentQty')}
                      </span>
                      <span className="text-lg font-bold text-white">
                        {editingProduct.stock_qty}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditorOpen(false);
                        openAdjustStockModal(editingProduct, 1, 'restock');
                      }}
                    >
                      {t('admin.products.stock.adjustTitle')}
                    </Button>
                  </div>
                )}

                <Input
                  label={t('admin.products.fields.lowStockThreshold')}
                  type="number"
                  min={0}
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  dir="ltr"
                />
              </div>

              {/* Specifications Table Editor */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    {t('admin.products.specs.title')}
                  </h3>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddSpecRow}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    {t('admin.products.specs.addSpec')}
                  </Button>
                </div>

                {specs.length === 0 ? (
                  <p className="text-xs text-[#8A93A3]">
                    {t('admin.products.specs.emptyHint')}
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pe-1">
                    {specs.map((sp, idx) => (
                      <div
                        key={idx}
                        className="rounded-md bg-[#0E1013] border border-white/10 p-3 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
                      >
                        <div className="sm:col-span-5">
                          <Input
                            label={`${t('admin.products.specs.labelEn')} #${idx + 1}`}
                            value={sp.label.en}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSpecs((prev) =>
                                prev.map((item, i) =>
                                  i === idx
                                    ? {
                                        ...item,
                                        label: {
                                          ...item.label,
                                          en: val,
                                          ur: item.label.ur || val,
                                          'ur-roman':
                                            item.label['ur-roman'] || val,
                                        },
                                      }
                                    : item
                                )
                              );
                            }}
                            placeholder="Viscosity / Capacity"
                          />
                        </div>
                        <div className="sm:col-span-6">
                          <Input
                            label={t('admin.products.specs.valueEn')}
                            value={sp.value.en}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSpecs((prev) =>
                                prev.map((item, i) =>
                                  i === idx
                                    ? {
                                        ...item,
                                        value: {
                                          ...item.value,
                                          en: val,
                                          ur: item.value.ur || val,
                                          'ur-roman':
                                            item.value['ur-roman'] || val,
                                        },
                                      }
                                    : item
                                )
                              );
                            }}
                            placeholder="5W-30 API SP / 4 Liters"
                          />
                        </div>
                        <div className="sm:col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveSpecRow(idx)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Product Images */}
          {editorTab === 'images' && (
            <div className="space-y-4">
              <div className="rounded-md bg-[#0E1013] border border-white/10 p-4 space-y-3">
                <ImageField
                  label={t('admin.products.images.uploadLabel')}
                  hint={t('admin.products.images.uploadHint')}
                  value={newImageUploadUrl}
                  onChange={setNewImageUploadUrl}
                  folderPrefix="products"
                  bucketName="product-images"
                />

                <div className="flex flex-col sm:flex-row gap-2.5 items-end">
                  <div className="flex-1 w-full">
                    <Input
                      label={t('admin.products.images.altLabel')}
                      value={newImageAlt}
                      onChange={(e) => setNewImageAlt(e.target.value)}
                      placeholder={nameMap.en || 'Product photo'}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddDraftImage}
                    disabled={!newImageUploadUrl.trim()}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    {t('admin.products.images.addImageToGallery')}
                  </Button>
                </div>
              </div>

              {draftImages.length === 0 ? (
                <p className="text-xs text-[#8A93A3] py-4 text-center">
                  {t('admin.products.images.emptyGalleryHint')}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {draftImages.map((im, idx) => (
                    <div
                      key={idx}
                      className="rounded-md bg-[#0E1013] border border-white/10 p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={im.url}
                          alt={im.alt}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded object-cover bg-[#1B1F26] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {im.alt || `Image #${idx + 1}`}
                          </p>
                          {im.is_primary ? (
                            <Badge variant="success">
                              {t('admin.products.images.primaryBadge')}
                            </Badge>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              className="text-[11px] text-[#FF6A00] hover:underline cursor-pointer"
                            >
                              {t('admin.products.images.makePrimary')}
                            </button>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveDraftImage(idx)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Vehicle Compatibility & Workshop Services */}
          {editorTab === 'compatibility' && (
            <div className="space-y-6">
              <div className="rounded-md bg-[#0E1013] border border-white/10 p-4 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUniversal}
                    onChange={(e) => setIsUniversal(e.target.checked)}
                    className="rounded border-white/20 bg-[#1B1F26] text-[#FF6A00]"
                  />
                  <span className="text-sm font-bold text-white">
                    {t('admin.products.fields.isUniversal')}
                  </span>
                </label>

                {!isUniversal && (
                  <div className="space-y-3 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#8A93A3]">
                        {t('admin.products.compatibility.fitmentRowsTitle')}
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleAddVehicleRow}
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                      >
                        {t('admin.products.compatibility.addVehicle')}
                      </Button>
                    </div>

                    {draftVehicles.length === 0 ? (
                      <p className="text-xs text-[#8A93A3]">
                        {t('admin.products.compatibility.noVehiclesHint')}
                      </p>
                    ) : (
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pe-1">
                        {draftVehicles.map((v, idx) => {
                          const makeModels = models.filter(
                            (m) => m.make_id === v.make_id
                          );
                          return (
                            <div
                              key={idx}
                              className="rounded bg-[#1B1F26] border border-white/10 p-3 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
                            >
                              <div className="sm:col-span-3">
                                <Select
                                  label={t('shop.vehicleSelector.make')}
                                  value={v.make_id}
                                  onChange={(e) => {
                                    const nextMake = e.target.value;
                                    setDraftVehicles((prev) =>
                                      prev.map((row, i) =>
                                        i === idx
                                          ? {
                                              ...row,
                                              make_id: nextMake,
                                              model_id: '',
                                            }
                                          : row
                                      )
                                    );
                                  }}
                                  options={makes.map((mk) => ({
                                    value: mk.id,
                                    label: mk.name,
                                  }))}
                                />
                              </div>

                              <div className="sm:col-span-3">
                                <Select
                                  label={t('shop.vehicleSelector.model')}
                                  value={v.model_id}
                                  onChange={(e) => {
                                    const nextModel = e.target.value;
                                    setDraftVehicles((prev) =>
                                      prev.map((row, i) =>
                                        i === idx
                                          ? { ...row, model_id: nextModel }
                                          : row
                                      )
                                    );
                                  }}
                                  options={[
                                    {
                                      value: '',
                                      label: t(
                                        'shop.compatibility.allModelsForMake'
                                      ),
                                    },
                                    ...makeModels.map((md) => ({
                                      value: md.id,
                                      label: md.name,
                                    })),
                                  ]}
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <Input
                                  label={t(
                                    'admin.products.compatibility.yearFrom'
                                  )}
                                  type="number"
                                  value={v.year_from}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDraftVehicles((prev) =>
                                      prev.map((row, i) =>
                                        i === idx
                                          ? { ...row, year_from: val }
                                          : row
                                      )
                                    );
                                  }}
                                  dir="ltr"
                                  placeholder="2014"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <Input
                                  label={t(
                                    'admin.products.compatibility.yearTo'
                                  )}
                                  type="number"
                                  value={v.year_to}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDraftVehicles((prev) =>
                                      prev.map((row, i) =>
                                        i === idx
                                          ? { ...row, year_to: val }
                                          : row
                                      )
                                    );
                                  }}
                                  dir="ltr"
                                  placeholder="2026"
                                />
                              </div>

                              <div className="sm:col-span-1">
                                <Select
                                  label={t('shop.vehicleSelector.fuelType')}
                                  value={v.fuel_type}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDraftVehicles((prev) =>
                                      prev.map((row, i) =>
                                        i === idx
                                          ? { ...row, fuel_type: val }
                                          : row
                                      )
                                    );
                                  }}
                                  options={[
                                    { value: '', label: 'Any' },
                                    ...FUEL_OPTIONS.map((f) => ({
                                      value: f,
                                      label: t(`vehicles.fuelTypes.${f}`),
                                    })),
                                  ]}
                                />
                              </div>

                              <div className="sm:col-span-1 flex justify-end">
                                <Button
                                  type="button"
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleRemoveVehicleRow(idx)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Linked Workshop Installation Services */}
              <div className="rounded-md bg-[#0E1013] border border-white/10 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#FF6A00]" />
                  <h3 className="text-sm font-bold text-white">
                    {t('admin.products.compatibility.linkedServicesTitle')}
                  </h3>
                </div>
                <p className="text-xs text-[#8A93A3]">
                  {t('admin.products.compatibility.linkedServicesHint')}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pt-1">
                  {services.map((srv) => {
                    const checked = selectedServiceIds.includes(srv.id);
                    return (
                      <label
                        key={srv.id}
                        className="flex items-center gap-2.5 rounded bg-[#1B1F26] border border-white/10 px-3 py-2 cursor-pointer text-xs text-white"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleServiceLink(srv.id)}
                          className="rounded border-white/20 bg-[#0E1013] text-[#FF6A00]"
                        />
                        <span className="truncate">
                          {getLocalized(srv, 'name', i18n.language)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditorOpen(false)}
              disabled={savingProduct}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={savingProduct}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingProduct)}
        onClose={() => !deleting && setDeletingProduct(null)}
        title={t('admin.products.deleteTitle')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#8A93A3]">
            {t('admin.products.deleteConfirm', {
              name: deletingProduct
                ? getLocalized(deletingProduct, 'name', i18n.language)
                : '',
            })}
          </p>
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              variant="ghost"
              onClick={() => setDeletingProduct(null)}
              disabled={deleting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleConfirmDelete()}
              isLoading={deleting}
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
