"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";

interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
  totalItems?: number;
}

interface UsePaginationReturn<T> {
  // Data
  items: T[];
  setItems: (items: T[]) => void;
  appendItems: (newItems: T[]) => void;
  
  // Pagination state
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
  
  // Actions
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  setTotalItems: (total: number) => void;
  reset: () => void;
  
  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isLoadingMore: boolean;
  setIsLoadingMore: (loading: boolean) => void;
}

export function usePagination<T = unknown>(
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const {
    initialPage = 1,
    pageSize = 20,
    totalItems: initialTotal = 0,
  } = options;

  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [totalItems, setTotalItems] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const totalPages = Math.ceil(totalItems / pageSize);
  const hasMore = page < totalPages;

  const nextPage = useCallback(() => {
    if (hasMore) {
      setPage((p) => p + 1);
    }
  }, [hasMore]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage((p) => p - 1);
    }
  }, [page]);

  const goToPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages || 1));
    setPage(validPage);
  }, [totalPages]);

  const appendItems = useCallback((newItems: T[]) => {
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setTotalItems(0);
  }, [initialPage]);

  return {
    items,
    setItems,
    appendItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    hasMore,
    nextPage,
    prevPage,
    goToPage,
    setTotalItems,
    reset,
    isLoading,
    setIsLoading,
    isLoadingMore,
    setIsLoadingMore,
  };
}

// Infinite scroll hook
interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 200,
  rootMargin = "0px",
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!hasMore || isLoading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      {
        rootMargin: rootMargin || `0px 0px ${threshold}px 0px`,
      }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onLoadMore, hasMore, isLoading, threshold, rootMargin]);

  return { loadMoreRef };
}

// Pagination controls component
interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
}

export function PaginationControls({
  page,
  totalPages,
  onPageChange,
  isLoading = false,
  showPageNumbers = true,
  maxVisiblePages = 5,
}: PaginationControlsProps) {
  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, page - half);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1 || isLoading}
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        Previous
      </button>

      {showPageNumbers && (
        <div className="flex items-center gap-1">
          {page > 3 && totalPages > maxVisiblePages && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="w-10 h-10 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                1
              </button>
              {page > 4 && <span className="px-2 text-gray-400">...</span>}
            </>
          )}

          {getVisiblePages().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              disabled={isLoading}
              className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                pageNum === page
                  ? "bg-black text-white"
                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
              }`}
              aria-current={pageNum === page ? "page" : undefined}
            >
              {pageNum}
            </button>
          ))}

          {page < totalPages - 2 && totalPages > maxVisiblePages && (
            <>
              {page < totalPages - 3 && <span className="px-2 text-gray-400">...</span>}
              <button
                onClick={() => onPageChange(totalPages)}
                className="w-10 h-10 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages || isLoading}
        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
}

// Load more button component
interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
  hasMore: boolean;
}

export function LoadMoreButton({ onClick, isLoading, hasMore }: LoadMoreButtonProps) {
  if (!hasMore) return null;

  return (
    <div className="flex justify-center py-6">
      <button
        onClick={onClick}
        disabled={isLoading}
        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Loading..." : "Load More"}
      </button>
    </div>
  );
}

export default usePagination;
