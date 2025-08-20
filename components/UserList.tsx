"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  PaginatedResponse,
  SearchParams,
  User,
} from "@/hooks/usePaginatedUsers";
import { userFetcher } from "@/hooks/user-fetcher";

interface Props extends SearchParams {}

export default function UserList({
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
      setIsLoading(true);
      setError(null);
      try {
        if (pageCache.current.has(cursor)) {
          setData(pageCache.current.get(cursor)!);
        } else {
          const result = await userFetcher(
            { q, sortBy, order, take, filterBy },
            cursor
          );
          pageCache.current.set(cursor, result);
          if (pageCache.current.size > 10) {
            const firstKey = pageCache.current.keys().next().value;
            if (typeof firstKey !== "undefined") {
              pageCache.current.delete(firstKey);
            }
          }
          setData(result);
        }
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
  }, [searchKey]);

  const handleNext = () => {
    if (!data?.nextCursor || !data?.hasMore || data.users.length < take) return;

    const next = data.nextCursor;
    const updatedStack = [...cursorStack.slice(0, cursorIndex + 1), next];
    setCursorStack(updatedStack);
    setCursorIndex(cursorIndex + 1);
    fetchPage(next);
  };

  const handlePrevious = () => {
    if (cursorIndex === 0) return;
    const prevCursor = cursorStack[cursorIndex - 1];
    setCursorIndex(cursorIndex - 1);
    fetchPage(prevCursor);
  };

  if (isLoading) return <div>Loading users...</div>;
  if (error || !data) return <div>Error loading users.</div>;

  return (
    <div>
      <ul className="space-y-4">
        {data.users.map((user: User) => (
          <li key={uuidv4()} className="p-4 border rounded shadow-sm">
            <div className="font-semibold">{user.name}</div>
            <div className="text-sm text-gray-600">{user.email}</div>

            <div className="mt-2">
              <p className="font-medium text-sm">Orgs:</p>
              <ul className="ml-4 list-disc text-sm text-gray-700">
                {user.orgs.map((org) => (
                  <li key={`${user.id}-${org.orgId}`}>
                    {org.name} — <span className="italic">{org.role}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-2">
              <p className="font-medium text-sm">Teams:</p>
              <ul className="ml-4 list-disc text-sm text-gray-700">
                {user.teams.map((team) => (
                  <li key={`${user.id}-${team.teamId}`}>
                    {team.name} — <span className="italic">{team.role}</span>{" "}
                    (Org #{team.orgId})
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={cursorIndex === 0}
          className="px-4 py-2 bg-gray-300 text-black rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-sm text-gray-500">
          Showing {Math.min((cursorIndex + 1) * take, data.total)} of{" "}
          {data.total}
        </span>

        <button
          onClick={handleNext}
          disabled={
            !data?.nextCursor || !data?.hasMore || data.users.length < take
          }
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
