import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '../../lib/supabase';
import { env } from '../../lib/env';
import { useAuth } from '../auth/useAuth';
import type {
  FuelType,
  VehicleMakeRow,
  VehicleModelRow,
  VehicleRow,
} from '../../types/database';

const STORAGE_KEY = 'paw_selected_vehicle';

export interface SelectedVehicleFilter {
  makeId: string;
  makeName: string;
  modelId: string | null;
  modelName: string | null;
  year: number | null;
  fuelType: FuelType | null;
  includeUniversal: boolean;
}

interface VehicleFilterContextValue {
  selectedVehicle: SelectedVehicleFilter | null;
  hasSelection: boolean;
  selectionLabel: string;
  setSelectedVehicle: (vehicle: SelectedVehicleFilter | null) => void;
  updateIncludeUniversal: (includeUniversal: boolean) => void;
  clearVehicle: () => void;
  makes: VehicleMakeRow[];
  models: VehicleModelRow[];
  savedVehicles: VehicleRow[];
  loadingReference: boolean;
  selectFromSavedVehicle: (vehicle: VehicleRow) => void;
}

const VehicleFilterContext = createContext<VehicleFilterContextValue | undefined>(
  undefined
);

function loadStoredVehicle(): SelectedVehicleFilter | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SelectedVehicleFilter>;
    if (!parsed || typeof parsed.makeId !== 'string' || !parsed.makeId) {
      return null;
    }
    return {
      makeId: parsed.makeId,
      makeName: typeof parsed.makeName === 'string' ? parsed.makeName : '',
      modelId: typeof parsed.modelId === 'string' && parsed.modelId ? parsed.modelId : null,
      modelName:
        typeof parsed.modelName === 'string' && parsed.modelName ? parsed.modelName : null,
      year: typeof parsed.year === 'number' && Number.isFinite(parsed.year) ? parsed.year : null,
      fuelType: (parsed.fuelType as FuelType) || null,
      includeUniversal:
        typeof parsed.includeUniversal === 'boolean' ? parsed.includeUniversal : true,
    };
  } catch {
    return null;
  }
}

export function VehicleFilterProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedVehicle, setSelectedVehicleState] = useState<SelectedVehicleFilter | null>(
    () => loadStoredVehicle()
  );
  const [makes, setMakes] = useState<VehicleMakeRow[]>([]);
  const [models, setModels] = useState<VehicleModelRow[]>([]);
  const [savedVehicles, setSavedVehicles] = useState<VehicleRow[]>([]);
  const [loadingReference, setLoadingReference] = useState<boolean>(true);

  const setSelectedVehicle = useCallback((next: SelectedVehicleFilter | null) => {
    setSelectedVehicleState(next);
    if (typeof window !== 'undefined') {
      try {
        if (next) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // ignore storage errors
      }
    }
  }, []);

  const updateIncludeUniversal = useCallback((includeUniversal: boolean) => {
    setSelectedVehicleState((prev) => {
      if (!prev) return null;
      const updated = { ...prev, includeUniversal };
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
      return updated;
    });
  }, []);

  const clearVehicle = useCallback(() => {
    setSelectedVehicle(null);
  }, [setSelectedVehicle]);

  // Fetch vehicle makes & models once
  useEffect(() => {
    if (!env.isConfigured) {
      setLoadingReference(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingReference(true);
      const [makesRes, modelsRes] = await Promise.all([
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
      ]);

      if (!cancelled) {
        if (!makesRes.error && makesRes.data) {
          setMakes(makesRes.data as VehicleMakeRow[]);
        }
        if (!modelsRes.error && modelsRes.data) {
          setModels(modelsRes.data as VehicleModelRow[]);
        }
        setLoadingReference(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Hydrate missing makeName/modelName if loaded from IDs
  useEffect(() => {
    if (!selectedVehicle || makes.length === 0) return;
    const foundMake = makes.find((m) => m.id === selectedVehicle.makeId);
    const foundModel = selectedVehicle.modelId
      ? models.find((m) => m.id === selectedVehicle.modelId)
      : null;

    const nextMakeName = foundMake?.name || selectedVehicle.makeName;
    const nextModelName = foundModel?.name || selectedVehicle.modelName;

    if (
      nextMakeName !== selectedVehicle.makeName ||
      nextModelName !== selectedVehicle.modelName
    ) {
      setSelectedVehicle({
        ...selectedVehicle,
        makeName: nextMakeName,
        modelName: nextModelName,
      });
    }
  }, [makes, models, selectedVehicle, setSelectedVehicle]);

  // Fetch logged-in user's saved vehicles from My Garage
  useEffect(() => {
    if (!env.isConfigured || !user) {
      setSavedVehicles([]);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (!cancelled && !error && data) {
        setSavedVehicles(data as VehicleRow[]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const selectFromSavedVehicle = useCallback(
    (v: VehicleRow) => {
      const matchedMake = v.make_id
        ? makes.find((m) => m.id === v.make_id)
        : null;

      if (!matchedMake) return;

      const matchedModel = v.model_id
        ? models.find((m) => m.id === v.model_id)
        : null;

      setSelectedVehicle({
        makeId: matchedMake.id,
        makeName: matchedMake.name,
        modelId: matchedModel?.id ?? null,
        modelName: matchedModel?.name ?? null,
        year: v.year ?? null,
        fuelType: v.fuel_type ?? null,
        includeUniversal: selectedVehicle?.includeUniversal ?? true,
      });
    },
    [makes, models, selectedVehicle?.includeUniversal, setSelectedVehicle]
  );

  const selectionLabel = useMemo(() => {
    if (!selectedVehicle) return '';
    return [
      selectedVehicle.makeName,
      selectedVehicle.modelName,
      selectedVehicle.year ? String(selectedVehicle.year) : '',
    ]
      .filter(Boolean)
      .join(' ');
  }, [selectedVehicle]);

  const value = useMemo<VehicleFilterContextValue>(
    () => ({
      selectedVehicle,
      hasSelection: Boolean(selectedVehicle),
      selectionLabel,
      setSelectedVehicle,
      updateIncludeUniversal,
      clearVehicle,
      makes,
      models,
      savedVehicles,
      loadingReference,
      selectFromSavedVehicle,
    }),
    [
      selectedVehicle,
      selectionLabel,
      setSelectedVehicle,
      updateIncludeUniversal,
      clearVehicle,
      makes,
      models,
      savedVehicles,
      loadingReference,
      selectFromSavedVehicle,
    ]
  );

  return (
    <VehicleFilterContext.Provider value={value}>
      {children}
    </VehicleFilterContext.Provider>
  );
}

export function useVehicleFilter(): VehicleFilterContextValue {
  const ctx = useContext(VehicleFilterContext);
  if (!ctx) {
    throw new Error('useVehicleFilter must be used within a VehicleFilterProvider');
  }
  return ctx;
}
