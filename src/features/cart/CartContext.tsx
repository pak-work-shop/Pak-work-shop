import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { useAuth } from '../auth/useAuth';
import { isMissingDatabaseObjectsError } from '../jobs/jobUtils';
import {
  computeFallbackQuote,
  DEFAULT_DELIVERY_SETTINGS,
  DEFAULT_PAKISTAN_CITIES,
} from '../orders/orderUtils';
import type {
  CartStoredItem,
  DeliverySettingsRow,
  PakistanCityRow,
  QuoteOrderResponse,
} from '../../types/database';

const CART_STORAGE_KEY = 'pak_auto_cart_v1';
const CITY_STORAGE_KEY = 'pak_auto_delivery_city_v1';
const COUPON_STORAGE_KEY = 'pak_auto_coupon_v1';

export const MAX_CART_DISTINCT_LINES = 30;
export const MAX_CART_UNITS_PER_LINE = 20;

interface CartContextValue {
  items: CartStoredItem[];
  totalDistinctItems: number;
  totalUnitCount: number;
  totalQuantity: number;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  couponCode: string;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  cities: PakistanCityRow[];
  deliverySettings: DeliverySettingsRow;
  quote: QuoteOrderResponse;
  quoteLoading: boolean;
  schemaMissing: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (
    product: Omit<CartStoredItem, 'quantity'>,
    quantity?: number,
    openDrawerAfter?: boolean
  ) => boolean;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  fixCartProblems: () => void;
  getItemQuantity: (productId: string) => number;
  refreshQuote: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadStoredCart(): CartStoredItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item: any) =>
          item &&
          typeof item.product_id === 'string' &&
          typeof item.sku === 'string' &&
          typeof item.quantity === 'number' &&
          item.quantity > 0
      )
      .slice(0, MAX_CART_DISTINCT_LINES)
      .map((item: any) => ({
        product_id: String(item.product_id),
        sku: String(item.sku),
        slug: String(item.slug ?? ''),
        name:
          item.name && typeof item.name === 'object'
            ? item.name
            : { en: String(item.sku), ur: '', 'ur-roman': '' },
        unit_price: Number(item.unit_price ?? 0),
        compare_at_price:
          item.compare_at_price !== null && item.compare_at_price !== undefined
            ? Number(item.compare_at_price)
            : null,
        primary_image_url: item.primary_image_url ?? null,
        part_origin: item.part_origin ?? 'aftermarket',
        stock_qty: Number(item.stock_qty ?? 20),
        quantity: Math.min(
          MAX_CART_UNITS_PER_LINE,
          Math.max(1, Math.floor(Number(item.quantity)))
        ),
      }));
  } catch {
    return [];
  }
}

function loadStoredString(key: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [items, setItems] = useState<CartStoredItem[]>(() => loadStoredCart());
  const [selectedCity, setSelectedCityState] = useState<string>(() =>
    loadStoredString(CITY_STORAGE_KEY, 'Sadiqabad')
  );
  const [couponCode, setCouponCodeState] = useState<string>(() =>
    loadStoredString(COUPON_STORAGE_KEY, '')
  );
  const [cities, setCities] = useState<PakistanCityRow[]>(
    DEFAULT_PAKISTAN_CITIES
  );
  const [deliverySettings, setDeliverySettings] =
    useState<DeliverySettingsRow>(DEFAULT_DELIVERY_SETTINGS);
  const [serverQuote, setServerQuote] = useState<QuoteOrderResponse | null>(
    null
  );
  const [quoteLoading, setQuoteLoading] = useState<boolean>(false);
  const [schemaMissing, setSchemaMissing] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const syncedUserIdRef = useRef<string | null>(null);

  // Persist cart items to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota errors
    }
  }, [items]);

  const setSelectedCity = useCallback((city: string) => {
    const clean = city.trim() || 'Sadiqabad';
    setSelectedCityState(clean);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(CITY_STORAGE_KEY, clean);
      } catch {
        // Ignore
      }
    }
  }, []);

  const setCouponCodePersisted = useCallback((code: string) => {
    const clean = code.trim().toUpperCase();
    setCouponCodeState(clean);
    if (typeof window !== 'undefined') {
      try {
        if (clean) {
          window.localStorage.setItem(COUPON_STORAGE_KEY, clean);
        } else {
          window.localStorage.removeItem(COUPON_STORAGE_KEY);
        }
      } catch {
        // Ignore
      }
    }
  }, []);

  // Load pakistan_cities and delivery_settings on mount
  const loadDeliveryMetadata = useCallback(async () => {
    if (!env.isConfigured) return;
    try {
      const [citiesRes, dsRes] = await Promise.all([
        supabase
          .from('pakistan_cities')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('name', { ascending: true }),
        supabase
          .from('delivery_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle(),
      ]);

      if (citiesRes.error && isMissingDatabaseObjectsError(citiesRes.error)) {
        setSchemaMissing(true);
      } else if (!citiesRes.error && citiesRes.data && citiesRes.data.length > 0) {
        setSchemaMissing(false);
        setCities(citiesRes.data as PakistanCityRow[]);
      }

      if (!dsRes.error && dsRes.data) {
        const raw = dsRes.data as any;
        setDeliverySettings({
          id: 1,
          flat_rate: Number(raw.flat_rate ?? 300),
          free_cities: Array.isArray(raw.free_cities)
            ? raw.free_cities
            : ['Sadiqabad'],
          free_over_amount:
            raw.free_over_amount !== null && raw.free_over_amount !== undefined
              ? Number(raw.free_over_amount)
              : null,
          min_order_amount: Number(raw.min_order_amount ?? 0),
          cod_enabled: Boolean(raw.cod_enabled ?? true),
          cod_max_amount:
            raw.cod_max_amount !== null && raw.cod_max_amount !== undefined
              ? Number(raw.cod_max_amount)
              : null,
          cod_blocked_cities: Array.isArray(raw.cod_blocked_cities)
            ? raw.cod_blocked_cities
            : [],
          online_payment_enabled: Boolean(raw.online_payment_enabled ?? false),
          updated_at: raw.updated_at ?? new Date().toISOString(),
        });
      }
    } catch {
      // Fallback to defaults
    }
  }, []);

  useEffect(() => {
    void loadDeliveryMetadata();
    const onSettingsUpdated = () => {
      void loadDeliveryMetadata();
    };
    window.addEventListener('delivery-settings-updated', onSettingsUpdated);
    return () => {
      window.removeEventListener('delivery-settings-updated', onSettingsUpdated);
    };
  }, [loadDeliveryMetadata]);

  // Merge & sync with user_carts when user logs in
  useEffect(() => {
    if (!env.isConfigured || !user) {
      syncedUserIdRef.current = null;
      return;
    }
    if (syncedUserIdRef.current === user.id) return;
    syncedUserIdRef.current = user.id;

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('user_carts')
          .select('items')
          .eq('user_id', user.id)
          .maybeSingle();

        if (cancelled || error) return;

        const remoteItems: CartStoredItem[] =
          data && Array.isArray((data as any).items) ? (data as any).items : [];

        setItems((localItems) => {
          if (localItems.length === 0 && remoteItems.length > 0) {
            return remoteItems.slice(0, MAX_CART_DISTINCT_LINES);
          }
          if (localItems.length > 0 && remoteItems.length > 0) {
            const mergedMap = new Map<string, CartStoredItem>();
            for (const r of remoteItems) {
              if (r && r.product_id) {
                mergedMap.set(r.product_id, r);
              }
            }
            for (const l of localItems) {
              const existing = mergedMap.get(l.product_id);
              if (existing) {
                mergedMap.set(l.product_id, {
                  ...l,
                  quantity: Math.min(
                    MAX_CART_UNITS_PER_LINE,
                    Math.max(existing.quantity, l.quantity)
                  ),
                });
              } else if (mergedMap.size < MAX_CART_DISTINCT_LINES) {
                mergedMap.set(l.product_id, l);
              }
            }
            return Array.from(mergedMap.values());
          }
          return localItems;
        });
      } catch {
        // Ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Persist cart to user_carts when logged in and items change
  useEffect(() => {
    if (!env.isConfigured || !user || schemaMissing) return;
    const timer = window.setTimeout(async () => {
      try {
        await supabase.from('user_carts').upsert(
          {
            user_id: user.id,
            items,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      } catch {
        // Ignore
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [items, user, schemaMissing]);

  // Authoritative quote from quote_order RPC
  const refreshQuote = useCallback(async () => {
    if (items.length === 0) {
      setServerQuote(null);
      return;
    }

    if (!env.isConfigured) {
      setServerQuote(null);
      return;
    }

    setQuoteLoading(true);
    try {
      const payload = items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        client_unit_price: item.unit_price,
        sku: item.sku,
        slug: item.slug,
        name: item.name,
      }));

      const { data, error } = await supabase.rpc('quote_order', {
        p_items: payload,
        p_city: selectedCity || 'Sadiqabad',
        p_coupon: couponCode || null,
      });

      if (error) {
        if (isMissingDatabaseObjectsError(error)) {
          setSchemaMissing(true);
        }
        setServerQuote(null);
        return;
      }

      if (data) {
        setSchemaMissing(false);
        setServerQuote(data as unknown as QuoteOrderResponse);
      }
    } catch {
      setServerQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  }, [items, selectedCity, couponCode]);

  useEffect(() => {
    void refreshQuote();
  }, [refreshQuote]);

  const fallbackQuote = useMemo(
    () =>
      computeFallbackQuote(items, selectedCity, couponCode, deliverySettings),
    [items, selectedCity, couponCode, deliverySettings]
  );

  const quote = serverQuote ?? fallbackQuote;

  const addItem = useCallback(
    (
      product: Omit<CartStoredItem, 'quantity'>,
      quantity = 1,
      openDrawerAfter = true
    ): boolean => {
      if (product.stock_qty <= 0) {
        toast.error(t('cart.errors.outOfStock'));
        return false;
      }

      const cleanQty = Math.max(1, Math.floor(quantity));
      let added = false;

      setItems((prev) => {
        const existingIdx = prev.findIndex(
          (i) => i.product_id === product.product_id
        );

        if (existingIdx >= 0) {
          const existing = prev[existingIdx];
          const maxAllowed = Math.min(
            MAX_CART_UNITS_PER_LINE,
            Math.max(1, product.stock_qty)
          );
          const nextQty = Math.min(maxAllowed, existing.quantity + cleanQty);
          const next = [...prev];
          next[existingIdx] = {
            ...existing,
            ...product,
            quantity: nextQty,
          };
          added = true;
          return next;
        }

        if (prev.length >= MAX_CART_DISTINCT_LINES) {
          toast.error(
            t('cart.errors.maxLinesReached', { max: MAX_CART_DISTINCT_LINES })
          );
          return prev;
        }

        const maxAllowed = Math.min(
          MAX_CART_UNITS_PER_LINE,
          Math.max(1, product.stock_qty)
        );
        added = true;
        return [
          ...prev,
          {
            ...product,
            quantity: Math.min(maxAllowed, cleanQty),
          },
        ];
      });

      if (added) {
        toast.success(t('cart.addedToast'));
        if (openDrawerAfter) {
          setIsDrawerOpen(true);
        }
      }
      return added;
    },
    [t]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        setItems((prev) => prev.filter((i) => i.product_id !== productId));
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.product_id !== productId) return item;
          const maxStock = item.stock_qty > 0 ? item.stock_qty : MAX_CART_UNITS_PER_LINE;
          const clamped = Math.min(
            MAX_CART_UNITS_PER_LINE,
            maxStock,
            Math.max(1, Math.floor(quantity))
          );
          return { ...item, quantity: clamped };
        })
      );
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setCouponCodePersisted('');
    setServerQuote(null);
  }, [setCouponCodePersisted]);

  const fixCartProblems = useCallback(() => {
    if (!serverQuote) return;
    const validLines = serverQuote.lines.filter(
      (line) => line.is_active && line.available_stock > 0
    );

    setItems(
      validLines.map((line) => ({
        product_id: line.product_id,
        sku: line.sku,
        slug: line.slug,
        name: line.name,
        unit_price: Number(line.unit_price),
        compare_at_price: line.compare_at_price ?? null,
        primary_image_url: line.primary_image_url ?? null,
        part_origin: line.part_origin,
        stock_qty: line.available_stock,
        quantity: Math.min(
          MAX_CART_UNITS_PER_LINE,
          line.available_stock,
          line.quantity
        ),
      }))
    );
    toast.success(t('cart.problemsFixedToast'));
  }, [serverQuote, t]);

  const applyCoupon = useCallback(
    async (code: string) => {
      const clean = code.trim().toUpperCase();
      setCouponCodePersisted(clean);
    },
    [setCouponCodePersisted]
  );

  const removeCoupon = useCallback(() => {
    setCouponCodePersisted('');
  }, [setCouponCodePersisted]);

  const getItemQuantity = useCallback(
    (productId: string) => {
      const found = items.find((i) => i.product_id === productId);
      return found ? found.quantity : 0;
    },
    [items]
  );

  const totalDistinctItems = items.length;
  const totalUnitCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalDistinctItems,
      totalUnitCount,
      totalQuantity: totalUnitCount,
      selectedCity,
      setSelectedCity,
      couponCode,
      applyCoupon,
      removeCoupon,
      cities,
      deliverySettings,
      quote,
      quoteLoading,
      schemaMissing,
      isDrawerOpen,
      openDrawer: () => setIsDrawerOpen(true),
      closeDrawer: () => setIsDrawerOpen(false),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      fixCartProblems,
      getItemQuantity,
      refreshQuote,
    }),
    [
      items,
      totalDistinctItems,
      totalUnitCount,
      selectedCity,
      setSelectedCity,
      couponCode,
      applyCoupon,
      removeCoupon,
      cities,
      deliverySettings,
      quote,
      quoteLoading,
      schemaMissing,
      isDrawerOpen,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      fixCartProblems,
      getItemQuantity,
      refreshQuote,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
