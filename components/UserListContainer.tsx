// components/UserListContainer.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  PaginatedResponse,
  SearchParams,
  User,
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

  const pageCache = useRef<Map<string | null, PaginatedResponse>>(new Map());
  const searchKey = JSON.stringify({ q, sortBy, order, take, filterBy });

  const fetchPage = useCallback(
    async (cursor: string | null) => {
      try {
        setIsLoading(true);
        setError(null);

        const result = pageCache.current.has(cursor)
          ? pageCache.current.get(cursor)!
          : await userFetcher({ q, sortBy, order, take, filterBy }, cursor);

        if (!pageCache.current.has(cursor)) {
          pageCache.current.set(cursor, result);
          if (pageCache.current.size > 10) {
            const first = pageCache.current.keys().next().value;
            if (first !== undefined) {
              pageCache.current.delete(first);
            }
          }
        }

        setData(result);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [q, sortBy, order, take, filterBy]
  );

  useEffect(() => {
    pageCache.current.clear();
    setCursorStack([null]);
    setCursorIndex(0);
    fetchPage(null);
  }, [searchKey, fetchPage]);

  const handleNext = () => {
    if (!data?.nextCursor || !data?.hasMore || data.users.length < take) return;
    const next = data.nextCursor;
    setCursorStack((stack) => [...stack.slice(0, cursorIndex + 1), next]);
    setCursorIndex((ci) => ci + 1);
    fetchPage(next);
  };

  const handlePrevious = () => {
    if (cursorIndex === 0) return;
    const prevCursor = cursorStack[cursorIndex - 1];
    setCursorIndex((ci) => ci - 1);
    fetchPage(prevCursor);
  };

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
      hasNext={
        !!data?.nextCursor && data.hasMore && (data?.users || []).length >= take
      }
      keyGenerator={(user) => uuidv4()}
    />
  );
}
