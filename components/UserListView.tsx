// components/UserListView.tsx
import React from "react";
import type { User } from "@/hooks/usePaginatedUsers";

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
  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error loading users.</div>;

  // Note: shown is now computed in the container; keeping UI simple is fine too.
  // If you prefer to keep it here, pass `shown` as a prop.
  const approxShown = Math.min((pageIndex + 1) * take, total);
  const disableNext = !hasNext || isFetchingNextPage;

  return (
    <div>
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

      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={onPrevious}
          disabled={pageIndex === 0}
          className="px-4 py-2 bg-gray-300 text-black rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-sm text-gray-500">
          {/* If you want exact "shown", pass it down from container instead of approxShown */}
          Showing {approxShown} of {total}
        </span>

        <button
          onClick={onNext}
          disabled={disableNext}
          aria-busy={isFetchingNextPage || undefined}
          className={[
            "px-4 py-2 rounded text-white inline-flex items-center gap-2",
            "bg-blue-600 disabled:opacity-50",
            isFetchingNextPage ? "opacity-100 cursor-wait" : "", // override fade while fetching
          ].join(" ")}
        >
          <span>Next</span>
          {isFetchingNextPage && (
            <span
              className="inline-block h-3 w-3 rounded-full border-2 border-white/80 border-t-transparent animate-spin"
              aria-hidden="true"
            />
          )}
        </button>
      </div>
    </div>
  );
}
