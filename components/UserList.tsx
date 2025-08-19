import { usePaginatedUsers } from "@/hooks/usePaginatedUsers";

interface Props {
  q?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  take?: number;
}

export default function UserList({
  q,
  sortBy,
  order = "asc",
  take = 10,
}: Props) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = usePaginatedUsers({ q, sortBy, order, take });

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error loading users.</div>;

  const users = data?.pages.flatMap((page) => page.users) || [];

  return (
    <div>
      <ul className="space-y-4">
        {users.map((user) => (
          <li key={user.id} className="p-4 border rounded shadow-sm">
            <div className="font-semibold">{user.name}</div>
            <div className="text-sm text-gray-600">{user.email}</div>

            <div className="mt-2">
              <p className="font-medium text-sm">Orgs:</p>
              <ul className="ml-4 list-disc text-sm text-gray-700">
                {user.orgs.map((org) => (
                  <li key={org.orgId}>
                    {org.name} — <span className="italic">{org.role}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-2">
              <p className="font-medium text-sm">Teams:</p>
              <ul className="ml-4 list-disc text-sm text-gray-700">
                {user.teams.map((team) => (
                  <li key={team.teamId}>
                    {team.name} — <span className="italic">{team.role}</span>{" "}
                    (Org #{team.orgId})
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>

      {hasNextPage && (
        <div className="mt-6 text-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {isFetchingNextPage ? "Loading more..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
