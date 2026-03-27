"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { debounce } from "@/lib/utils";

interface UseSearchOptions {
  initialValue?: string;
  debounceMs?: number;
  minLength?: number;
  onSearch?: (query: string) => void;
}

interface UseSearchReturn {
  query: string;
  debouncedQuery: string;
  setQuery: (query: string) => void;
  clearQuery: () => void;
  isSearching: boolean;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    initialValue = "",
    debounceMs = 300,
    minLength = 0,
    onSearch,
  } = options;

  const [query, setQueryState] = useState(initialValue);
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);

  // Create debounced setter
  const debouncedSetQuery = useRef(
    debounce((value: string) => {
      setDebouncedQuery(value);
      setIsSearching(false);
      if (onSearch && value.length >= minLength) {
        onSearch(value);
      }
    }, debounceMs)
  ).current;

  const setQuery = useCallback((value: string) => {
    setQueryState(value);
    if (value !== debouncedQuery) {
      setIsSearching(true);
      debouncedSetQuery(value);
    }
  }, [debouncedSetQuery, debouncedQuery]);

  const clearQuery = useCallback(() => {
    setQueryState("");
    setDebouncedQuery("");
    setIsSearching(false);
    if (onSearch) {
      onSearch("");
    }
  }, [onSearch]);

  return {
    query,
    debouncedQuery,
    setQuery,
    clearQuery,
    isSearching,
  };
}

export default useSearch;
