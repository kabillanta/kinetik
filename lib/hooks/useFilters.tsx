"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export interface FilterState {
  status?: string;
  dateRange?: { start: string; end: string };
  location?: string;
  skills?: string[];
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface UseFiltersOptions {
  initialFilters?: FilterState;
  syncWithUrl?: boolean;
  debounceMs?: number;
}

interface UseFiltersReturn {
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilter: (key: keyof FilterState) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
}

export function useFilters(options: UseFiltersOptions = {}): UseFiltersReturn {
  const {
    initialFilters = {},
    syncWithUrl = false,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize from URL params if syncWithUrl is true
  const getInitialState = (): FilterState => {
    if (!syncWithUrl) return initialFilters;

    const urlFilters: FilterState = {};
    
    const status = searchParams.get("status");
    if (status) urlFilters.status = status;
    
    const location = searchParams.get("location");
    if (location) urlFilters.location = location;
    
    const search = searchParams.get("search");
    if (search) urlFilters.search = search;
    
    const skills = searchParams.get("skills");
    if (skills) urlFilters.skills = skills.split(",");
    
    const sortBy = searchParams.get("sortBy");
    if (sortBy) urlFilters.sortBy = sortBy;
    
    const sortOrder = searchParams.get("sortOrder") as "asc" | "desc";
    if (sortOrder) urlFilters.sortOrder = sortOrder;

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate && endDate) {
      urlFilters.dateRange = { start: startDate, end: endDate };
    }

    return { ...initialFilters, ...urlFilters };
  };

  const [filters, setFiltersState] = useState<FilterState>(getInitialState);

  const updateUrl = useCallback((newFilters: FilterState) => {
    if (!syncWithUrl) return;

    const params = new URLSearchParams();
    
    if (newFilters.status) params.set("status", newFilters.status);
    if (newFilters.location) params.set("location", newFilters.location);
    if (newFilters.search) params.set("search", newFilters.search);
    if (newFilters.skills?.length) params.set("skills", newFilters.skills.join(","));
    if (newFilters.sortBy) params.set("sortBy", newFilters.sortBy);
    if (newFilters.sortOrder) params.set("sortOrder", newFilters.sortOrder);
    if (newFilters.dateRange) {
      params.set("startDate", newFilters.dateRange.start);
      params.set("endDate", newFilters.dateRange.end);
    }

    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
  }, [syncWithUrl, pathname, router]);

  const setFilter = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFiltersState((prev) => {
      const newFilters = { ...prev, [key]: value };
      updateUrl(newFilters);
      return newFilters;
    });
  }, [updateUrl]);

  const setFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFiltersState((prev) => {
      const merged = { ...prev, ...newFilters };
      updateUrl(merged);
      return merged;
    });
  }, [updateUrl]);

  const clearFilter = useCallback((key: keyof FilterState) => {
    setFiltersState((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      updateUrl(newFilters);
      return newFilters;
    });
  }, [updateUrl]);

  const clearAllFilters = useCallback(() => {
    setFiltersState({});
    updateUrl({});
  }, [updateUrl]);

  const { hasActiveFilters, activeFilterCount } = useMemo(() => {
    let count = 0;
    if (filters.status) count++;
    if (filters.location) count++;
    if (filters.search) count++;
    if (filters.skills?.length) count++;
    if (filters.dateRange) count++;
    if (filters.sortBy) count++;
    
    return {
      hasActiveFilters: count > 0,
      activeFilterCount: count,
    };
  }, [filters]);

  return {
    filters,
    setFilter,
    setFilters,
    clearFilter,
    clearAllFilters,
    hasActiveFilters,
    activeFilterCount,
  };
}

export default useFilters;
