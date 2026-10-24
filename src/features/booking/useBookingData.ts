import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import type {
  AvailableSlotItem,
  BookingSettingsRow,
  MonthAvailabilityItem,
  VehicleMakeRow,
  VehicleModelRow,
} from '../../types/database';

export const DEFAULT_BOOKING_SETTINGS: BookingSettingsRow = {
  id: 1,
  online_booking_enabled: true,
  slot_minutes: 60,
  max_bookings_per_slot: 2,
  min_advance_hours: 2,
  max_advance_days: 30,
  allow_pickup_drop: true,
  updated_at: new Date().toISOString(),
};

export function useBookingSettings() {
  const [bookingSettings, setBookingSettings] = useState<BookingSettingsRow>(
    DEFAULT_BOOKING_SETTINGS
  );
  const [loading, setLoading] = useState<boolean>(env.isConfigured);

  const reload = useCallback(async () => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('booking_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (!error && data) {
        setBookingSettings({
          ...DEFAULT_BOOKING_SETTINGS,
          ...(data as BookingSettingsRow),
        });
      }
    } catch {
      // Fall back to defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { bookingSettings, loading, reload };
}

export function useVehicleCatalog() {
  const [makes, setMakes] = useState<VehicleMakeRow[]>([]);
  const [models, setModels] = useState<VehicleModelRow[]>([]);
  const [loading, setLoading] = useState<boolean>(env.isConfigured);

  useEffect(() => {
    if (!env.isConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [makesRes, modelsRes] = await Promise.all([
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

        if (!cancelled) {
          if (!makesRes.error && makesRes.data) {
            setMakes(makesRes.data as VehicleMakeRow[]);
          }
          if (!modelsRes.error && modelsRes.data) {
            setModels(modelsRes.data as VehicleModelRow[]);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { makes, models, loading };
}

export function useMonthAvailability(year: number, month: number) {
  const [days, setDays] = useState<Record<string, MonthAvailabilityItem['status']>>({});
  const [loading, setLoading] = useState<boolean>(env.isConfigured);

  const reload = useCallback(async () => {
    if (!env.isConfigured || !year || !month) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_month_availability', {
        p_year: year,
        p_month: month,
      });

      if (!error && Array.isArray(data)) {
        const map: Record<string, MonthAvailabilityItem['status']> = {};
        for (const item of data as MonthAvailabilityItem[]) {
          map[item.day] = item.status;
        }
        setDays(map);
      }
    } catch {
      // Keep existing map on error
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { days, loading, reload };
}

export function useAvailableSlots(dateStr: string | null) {
  const [slots, setSlots] = useState<AvailableSlotItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const reload = useCallback(async () => {
    if (!env.isConfigured || !dateStr) {
      setSlots([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_date: dateStr,
      });

      if (!error && Array.isArray(data)) {
        setSlots(data as AvailableSlotItem[]);
      } else {
        setSlots([]);
      }
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { slots, loading, reload };
}
