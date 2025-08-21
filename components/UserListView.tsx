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
import { SelectScrollable } from "./SelectScrollable";

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
  return (
    <div className="w-full">
      {!isLoading && !error && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Name</TableHead>
              <TableHead className="w-[260px]">Email</TableHead>
              <TableHead className="w-[300px]">Organization</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Invite Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.map((user) => {
              // Default to the topmost org for this row
              const firstOrgId = user.orgs[0]?.orgId ?? null;
              const [selectedOrgId, setSelectedOrgId] = useState<number | null>(
                firstOrgId
              );

              // If the row’s data changes (new user or new org order), reset to topmost
              useEffect(() => {
                setSelectedOrgId(firstOrgId);
              }, [firstOrgId, user.id]);

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
                      onChange={setSelectedOrgId}
                      placeholder="Select organization"
                      className="w-[260px]"
                    />
                  </TableCell>
                  <TableCell>{roleLabel}</TableCell>
                  <TableCell className="text-right">—</TableCell>
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
