// components/UserListView.tsx
import { useEffect, useState, useCallback } from "react";
import type { User } from "@/hooks/usePaginatedUsers";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SelectScrollable } from "./SelectScrollable";
import { MoreVertical } from "lucide-react";

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
  const approxShown = Math.min((pageIndex + 1) * take, total);
  const canPrev = pageIndex > 0;
  const disableNext = !hasNext || isFetchingNextPage;

  // ✅ Single state object for selections: { [userId]: orgId | null }
  const [selectedByUser, setSelectedByUser] = useState<
    Record<number, number | null>
  >({});

  // ✅ Reset to topmost org whenever the *list of users for this page* changes
  useEffect(() => {
    const next: Record<number, number | null> = {};
    for (const u of users) {
      next[u.id] = u.orgs[0]?.orgId ?? null;
    }
    setSelectedByUser(next);
  }, [users]);

  const handleSelectOrg = useCallback(
    (userId: number, orgId: number | null) => {
      setSelectedByUser((prev) => {
        if (prev[userId] === orgId) return prev;
        return { ...prev, [userId]: orgId };
      });
    },
    []
  );

  return (
    <div className="w-full">
      {!isLoading && !error && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Name</TableHead>
              <TableHead className="w-[260px]">Email</TableHead>
              <TableHead className="w-[280px]">Organization</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-center">Invite Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.map((user) => {
              // Default to the topmost org for this row
              const selectedOrgId =
                selectedByUser[user.id] ?? user.orgs[0]?.orgId ?? null;
              const selectedOrg =
                user.orgs.find((o) => o.orgId === selectedOrgId) ??
                user.orgs[0] ??
                null;
              const roleLabel = selectedOrg?.role ?? "—";
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="truncate">{user.email}</TableCell>
                  <TableCell>
                    <SelectScrollable
                      orgs={user.orgs}
                      value={selectedOrgId}
                      onChange={(orgId) => handleSelectOrg(user.id, orgId)}
                      placeholder="Select organization"
                      className="w-[260px] cursor-pointer"
                    />
                  </TableCell>
                  <TableCell>{roleLabel}</TableCell>
                  <TableCell className="text-center">—</TableCell>
                  <TableCell className="text-center">
                    <Button variant="outline" className="cursor-pointer">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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

            <PaginationItem className="pointer-events-none select-none px-2">
              <span
                className="text-sm text-muted-foreground"
                aria-live="polite"
                aria-atomic="true"
              >
                Showing {approxShown} of {total}
              </span>
            </PaginationItem>

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
                  "relative pr-6",
                  disableNext ? "pointer-events-none opacity-50" : "",
                  isFetchingNextPage
                    ? [
                        "[&>svg]:invisible",
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
