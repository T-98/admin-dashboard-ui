"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type {
  PaginatedResponse,
  SearchParams,
} from "@/hooks/usePaginatedUsers";
import { userFetcher } from "@/hooks/user-fetcher";
import UserListView from "./UserListView";

interface Props extends SearchParams {}

export default function UserListContainer({
  q,
  sortBy,
  order = "asc",
  take = 10,
  filterBy,
}: Props) {
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [cursorIndex, setCursorIndex] = useState(0);
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // cursor -> page cache (max 10)
  const pageCache = useRef<Map<string | null, PaginatedResponse>>(new Map());
  // ref to latest page to avoid stale reads in event handlers
  const dataRef = useRef<PaginatedResponse | null>(null);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const searchKey = useMemo(
    () => JSON.stringify({ q, sortBy, order, take, filterBy }),
    [q, sortBy, order, take, filterBy]
  );

  const fetchPage = useCallback(
    async (cursor: string | null) => {
      try {
        setIsLoading(true);
        setError(null);

        if (pageCache.current.has(cursor)) {
          setData(pageCache.current.get(cursor)!);
          return;
        }

        const result = await userFetcher(
          { q, sortBy, order, take, filterBy },
          cursor
        );

        pageCache.current.set(cursor, result);
        if (pageCache.current.size > 10) {
          const first = pageCache.current.keys().next().value;
          if (first !== undefined) pageCache.current.delete(first);
        }

        setData(result);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch users")
        );
      } finally {
        setIsLoading(false);
      }
    },
    [q, sortBy, order, take, filterBy]
  );

  useEffect(() => {
    // reset on param change
    pageCache.current.clear();
    setCursorStack([null]);
    setCursorIndex(0);
    void fetchPage(null);
  }, [searchKey, fetchPage]);

  const handleNext = useCallback(() => {
    if (isLoading) return; // simple guard against rapid double-clicks
    const current = dataRef.current;
    if (!current?.nextCursor) return; // trust the API's cursor

    const next = current.nextCursor;
    setCursorStack((stack) => [...stack.slice(0, cursorIndex + 1), next]);
    setCursorIndex((ci) => ci + 1);
    void fetchPage(next);
  }, [cursorIndex, isLoading, fetchPage]);

  const handlePrevious = useCallback(() => {
    if (isLoading || cursorIndex === 0) return;
    const prevCursor = cursorStack[cursorIndex - 1];
    setCursorIndex((ci) => ci - 1);
    void fetchPage(prevCursor);
  }, [cursorIndex, cursorStack, isLoading, fetchPage]);

  // Prefer the server signal; don't over-constrain with length checks
  const hasNext = Boolean(data?.nextCursor);

  return (
    <UserListView
      users={data?.users || []}
      total={data?.total || 0}
      take={take}
      pageIndex={cursorIndex}
      isLoading={isLoading}
      error={error}
      onNext={handleNext}
      onPrevious={handlePrevious}
      hasNext={hasNext && !isLoading}
    />
  );
}
