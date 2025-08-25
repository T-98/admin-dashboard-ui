// components/UserTableSkeleton.tsx
import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { ColumnId } from "@/components/search/SearchBar";
import { JSX } from "react";

type Props = { rows?: number; extraColumns?: ColumnId[] };

export default function UserTableSkeleton({
  rows = 10,
  extraColumns = [],
}: Props) {
  const showTeam = extraColumns.includes("team");
  const showTeamRole = extraColumns.includes("teamRole");
  const showTeamInvite = extraColumns.includes("teamInviteStatus");

  const W_MAIN = "w-[16rem]";
  const W_ROLE = "w-[12rem]";
  const W_STATUS = "w-[9rem]";
  const W_ACTION = "w-[8rem]";

  // ✅ Build <col> elements as an array so there’s ZERO whitespace in <colgroup>
  const cols: JSX.Element[] = [
    <col key="name" className={W_MAIN} />,
    <col key="email" className={W_MAIN} />,
    <col key="org" className={W_MAIN} />,
    <col key="orgRole" className={W_ROLE} />,
    <col key="orgInvite" className={W_STATUS} />,
  ];
  if (showTeam) cols.push(<col key="team" className={W_MAIN} />);
  if (showTeamRole) cols.push(<col key="teamRole" className={W_ROLE} />);
  if (showTeamInvite) cols.push(<col key="teamInvite" className={W_STATUS} />);
  cols.push(<col key="actions" className={W_ACTION} />);

  return (
    <div className="w-full">
      <Table className="table-fixed w-full">
        <colgroup>{cols}</colgroup>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Skeleton className="h-4 w-24" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-28" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-28" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-24 mx-auto" />
            </TableHead>
            {showTeam && (
              <TableHead>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            )}
            {showTeamRole && (
              <TableHead>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            )}
            {showTeamInvite && (
              <TableHead>
                <Skeleton className="h-4 w-24 mx-auto" />
              </TableHead>
            )}
            <TableHead className="text-center">
              <Skeleton className="h-4 w-16 mx-auto" />
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-40" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-9 w-56 rounded-md" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-24 rounded-md" />
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center">
                  <Skeleton className="h-4 w-20" />
                </div>
              </TableCell>
              {showTeam && (
                <TableCell>
                  <Skeleton className="h-9 w-56 rounded-md" />
                </TableCell>
              )}
              {showTeamRole && (
                <TableCell>
                  <Skeleton className="h-6 w-24 rounded-md" />
                </TableCell>
              )}
              {showTeamInvite && (
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <Skeleton className="h-4 w-20" />
                  </div>
                </TableCell>
              )}
              <TableCell className="text-center">
                <div className="flex justify-center">
                  <Skeleton className="h-9 w-9 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
