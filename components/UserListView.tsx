import React from "react";
import type { User } from "@/hooks/usePaginatedUsers";

interface Props {
  users: User[];
  total: number;
  take: number;
  pageIndex: number; // 0-based
  isLoading: boolean;
  error: Error | null;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean; // already includes !isLoading
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
}: Props) {
  // items from previous pages + current page length, capped by total
  const shown = Math.min(pageIndex * take + users.length, total);

  return (
    <div>
      {!isLoading && !error && (
        <ul className="space-y-4">
          {users.map((user) => (
            // Stable key from data — best practice
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
      {error && <div className="text-red-600">Error loading users.</div>}
      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={onPrevious}
          disabled={pageIndex === 0 || isLoading}
          className="px-4 py-2 bg-gray-300 text-black rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-sm text-gray-500">
          Showing {shown} of {total}
        </span>

        <button
          onClick={onNext}
          disabled={!hasNext}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
