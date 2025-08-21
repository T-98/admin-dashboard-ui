// components/UserListView.tsx
import React from "react";
import type { User } from "@/hooks/usePaginatedUsers";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

interface Props {
  users: User[];
  total: number;
  take: number;
  pageIndex: number;
  isLoading: boolean;
  error: Error | null;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  isFetchingNextPage: boolean;
}

export default function UserListView({
  users,
  total,
  take,
  pageIndex,
  isLoading,
  error,
  onNext,
  onPrevious,
  hasNext,
  isFetchingNextPage,
}: Props) {
  // Note: shown is now computed in the container; keeping UI simple is fine too.
  // If you prefer to keep it here, pass `shown` as a prop.
  const approxShown = Math.min((pageIndex + 1) * take, total);
  const canPrev = pageIndex > 0;
  const disableNext = !hasNext || isFetchingNextPage;

  return (
    <div>
      {!isLoading && !error && (
        <ul className="space-y-4">
          {users.map((user) => (
            // Stable keys from data — best practice
            <li key={user.id} className="p-4 border rounded shadow-sm">
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
      )}

      {isLoading && <div>Loading users...</div>}
      {error && <div className="text-red-600">Error: {error.message}</div>}

      {/* Pagination controls */}

      <div className="mt-6 flex justify-between items-center">
        <Pagination>
          <PaginationContent className="gap-2">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={!canPrev}
                onClick={(e) => {
                  e.preventDefault();
                  if (canPrev) onPrevious();
                }}
                className={!canPrev ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            <PaginationItem
              // No pointer events—this is informational, not a link
              className="pointer-events-none select-none px-2"
            >
              <span
                className="text-sm text-muted-foreground"
                aria-live="polite"
                aria-atomic="true"
              >
                Showing {approxShown} of {total}
              </span>
            </PaginationItem>

            {/* Next (native shadcn + spinner via pseudo-element) */}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={disableNext || undefined}
                aria-busy={isFetchingNextPage || undefined}
                onClick={(e) => {
                  e.preventDefault();
                  if (!disableNext) onNext();
                }}
                className={[
                  // add right padding to make space for spinner
                  "relative pr-6",
                  // block interaction when not allowed
                  disableNext ? "pointer-events-none opacity-50" : "",
                  // when fetching: hide the built-in chevron SVG and draw a spinner in its place
                  isFetchingNextPage
                    ? [
                        // hide the trailing <svg> chevron but keep its space
                        "[&>svg]:invisible",
                        // spinner pseudo-element at the same spot
                        "after:content-[''] after:absolute after:right-4",
                        "after:top-1/2 after:-translate-y-1/2",
                        "after:h-3 after:w-3 after:rounded-full",
                        "after:border-2 after:border-current after:border-t-transparent",
                        "after:animate-spin",
                      ].join(" ")
                    : "",
                ].join(" ")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
