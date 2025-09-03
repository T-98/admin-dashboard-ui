// components/search/SearchBar.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Columns3Cog, Inbox, X } from "lucide-react";
import Filter from "./Filter";
import { Sort, type SortBy } from "./Sort";
import { buildUserSearchQueryFromUI, type SearchKey } from "@/lib/search-build";
import axios from "axios";
import { toast } from "sonner";

export const COLUMN_OPTIONS = [
  { id: "team", label: "Team" },
  { id: "teamRole", label: "Team Role" },
  { id: "teamInviteStatus", label: "Team Invite Status" },
] as const;

export type ColumnId = (typeof COLUMN_OPTIONS)[number]["id"];

type Props = {
  selected: Set<ColumnId>;
  onChange: (next: Set<ColumnId>) => void;
  onQueryChange?: (key: SearchKey) => void;
  /** debounce for main q */
  debounceMs?: number;
  /** debounce for org/team filters (defaults to 1000ms per request) */
  filterDebounceMs?: number;
  /** current signed-in user (for invites inbox) */
  currentUser?: { userId: number; email: string; password: string } | null;
};

export default function SearchBar({
  selected,
  onChange,
  onQueryChange,
  debounceMs = 300,
  filterDebounceMs = 1000, // << 1s for org/team filters
  currentUser,
}: Props) {
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<SortBy | null>(null);
  const [orgQuery, setOrgQuery] = useState("");
  const [teamQuery, setTeamQuery] = useState("");
  const [take, setTake] = useState<number>(10);

  // Debounced copies
  const [dq, setDq] = useState(q);
  const [dOrg, setDOrg] = useState(orgQuery);
  const [dTeam, setDTeam] = useState(teamQuery);

  // timers to allow explicit flush (Enter)
  const qTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // signature to de-dupe emissions
  const lastEmittedRef = useRef<string>("");

  // debounce q
  useEffect(() => {
    if (qTimerRef.current) clearTimeout(qTimerRef.current);
    qTimerRef.current = setTimeout(() => {
      setDq(q);
      qTimerRef.current = null;
    }, debounceMs);
    return () => {
      if (qTimerRef.current) {
        clearTimeout(qTimerRef.current);
        qTimerRef.current = null;
      }
    };
  }, [q, debounceMs]);

  // debounce org
  useEffect(() => {
    if (orgTimerRef.current) clearTimeout(orgTimerRef.current);
    orgTimerRef.current = setTimeout(() => {
      setDOrg(orgQuery);
      orgTimerRef.current = null;
    }, filterDebounceMs);
    return () => {
      if (orgTimerRef.current) {
        clearTimeout(orgTimerRef.current);
        orgTimerRef.current = null;
      }
    };
  }, [orgQuery, filterDebounceMs]);

  // debounce team
  useEffect(() => {
    if (teamTimerRef.current) clearTimeout(teamTimerRef.current);
    teamTimerRef.current = setTimeout(() => {
      setDTeam(teamQuery);
      teamTimerRef.current = null;
    }, filterDebounceMs);
    return () => {
      if (teamTimerRef.current) {
        clearTimeout(teamTimerRef.current);
        teamTimerRef.current = null;
      }
    };
  }, [teamQuery, filterDebounceMs]);

  // Build with *debounced* values
  const builtDebounced = useMemo(
    () =>
      buildUserSearchQueryFromUI({
        q: dq,
        sortBy,
        organizationName: dOrg,
        teamName: dTeam,
        take,
      }),
    [dq, dOrg, dTeam, sortBy, take]
  );

  // Emit when debounced build changes
  useEffect(() => {
    if (!onQueryChange) return;
    const sig = builtDebounced.url;
    if (sig !== lastEmittedRef.current) {
      lastEmittedRef.current = sig;
      onQueryChange(builtDebounced.key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builtDebounced]);

  // Submit (Enter): cancel all timers, sync debounced values, emit immediately
  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (qTimerRef.current) {
        clearTimeout(qTimerRef.current);
        qTimerRef.current = null;
      }
      if (orgTimerRef.current) {
        clearTimeout(orgTimerRef.current);
        orgTimerRef.current = null;
      }
      if (teamTimerRef.current) {
        clearTimeout(teamTimerRef.current);
        teamTimerRef.current = null;
      }

      // sync debounced copies to raw values
      setDq(q);
      setDOrg(orgQuery);
      setDTeam(teamQuery);

      // build from raw
      const builtNow = buildUserSearchQueryFromUI({
        q,
        sortBy,
        organizationName: orgQuery,
        teamName: teamQuery,
        take,
      });

      const sig = builtNow.url;
      if (sig !== lastEmittedRef.current) {
        lastEmittedRef.current = sig;
        onQueryChange?.(builtNow.key);
      }
    },
    [q, orgQuery, teamQuery, sortBy, take, onQueryChange]
  );

  const toggle = useCallback(
    (id: ColumnId, next: boolean) => {
      const s = new Set(selected);
      next ? s.add(id) : s.delete(id);
      onChange(s);
    },
    [selected, onChange]
  );

  const selectedCount = selected.size;
  const hasQ = q.trim().length > 0;

  // Invites inbox state
  const [showInvites, setShowInvites] = useState(false);
  type Invite = {
    id: number;
    email: string;
    orgRole: string | null;
    teamRole: string | null;
    status: "PENDING" | "ACCEPTED" | string;
    createdAt: string;
    acceptedAt: string | null;
    invitedUserId: number;
    organizationId: number | null;
    organizationName: string | null;
    teamId: number | null;
    teamName: string | null;
  };

  // Fetch current user's invites
  const userIdForInvites = currentUser?.userId ?? 101;
  const invitesQuery = useQuery<
    { invites: Invite[] } | Invite[] | Invite[],
    Error
  >({
    queryKey: ["currentUserInvites", userIdForInvites],
    queryFn: async () => {
      const url = `http://localhost:3000/api/invites`;
      const res = await axios.get(url, {
        params: { userIds: String(userIdForInvites) },
        headers: {
          "x-email": currentUser?.email ?? "",
          "x-password": currentUser?.password ?? "",
        },
        validateStatus: () => true,
      });
      if (res.status < 200 || res.status >= 300) {
        throw new Error(`Failed to load invites (HTTP ${res.status})`);
      }
      return res.data as any;
    },
    enabled: !!currentUser?.email && !!currentUser?.password,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  // React Query v5: callbacks like onError are not supported on useQuery options
  useEffect(() => {
    if (invitesQuery.isError) {
      const err = invitesQuery.error as unknown;
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error("Failed to load invites", { description: msg });
    }
  }, [invitesQuery.isError, invitesQuery.error]);

  const invites: Invite[] = useMemo(() => {
    const d = invitesQuery.data as any;
    // handle shapes: {invites: []} or []
    if (!d) return [];
    if (Array.isArray(d)) return d as Invite[];
    if (Array.isArray(d.invites)) return d.invites as Invite[];
    return [];
  }, [invitesQuery.data]);

  const pendingInvites = invites.filter((i) => i.status === "PENDING");

  // Accept invite mutation
  const acceptInvite = useMutation({
    mutationKey: ["acceptInvite"],
    mutationFn: async (invite: Invite) => {
      const res = await axios.post(
        `http://localhost:3000/api/invites/accept`,
        {
          email: currentUser?.email,
          inviteId: Number(invite.id),
        },
        {
          headers: {
            "x-email": currentUser?.email ?? "",
            "x-password": currentUser?.password ?? "",
          },
          validateStatus: () => true,
        }
      );
      if (res.status < 200 || res.status >= 300) {
        const msg = (res.data as any)?.message || `Failed (HTTP ${res.status})`;
        throw new Error(msg);
      }
      return res.data as any;
    },
    onSuccess: (_data, variables) => {
      // Refresh invites after accept
      invitesQuery.refetch();
      const v = variables as any;
      const desc = v?.teamName
        ? `Joined Team ${v.teamName} in ${v.organizationName ?? "Organization"}`
        : `Joined ${v?.organizationName ?? "Organization"}`;
      toast.success("Invite accepted", { description: desc });
    },
    onError: (err: any) => {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error("Accept failed", { description: msg });
    },
  });

  return (
    <div className="w-full flex items-center justify-between gap-3 mb-4">
      <form onSubmit={onSubmit} className="flex items-center gap-2 flex-1">
        <div className="relative w-full">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          />
          <Input
            id="search"
            type="search"
            placeholder="Search users…"
            className="pl-9"
            aria-label="Search users"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <Sort value={sortBy} onChange={setSortBy} queryHasQ={hasQ} />

        {/* Pass raw values; SearchBar debounces before emitting */}
        <Filter
          orgQuery={orgQuery}
          teamQuery={teamQuery}
          onOrgChange={setOrgQuery}
          onTeamChange={setTeamQuery}
        />

        {/* Page size (take) */}
        <div className="flex items-center gap-2 ml-2">
          <label htmlFor="take" className="text-sm text-muted-foreground">
            Page size
          </label>
          <Input
            id="take"
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            className="w-24"
            value={take}
            onChange={(e) => {
              const next = Math.trunc(e.currentTarget.valueAsNumber);
              if (Number.isNaN(next)) return; // ignore transient NaN
              const clamped = Math.max(1, Math.min(100, next));
              setTake(clamped);
            }}
          />
        </div>

        <button type="submit" className="hidden" aria-hidden="true" />
      </form>

      <div className="flex items-center gap-2">
        {/* Invites inbox button */}
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                aria-label="Open Invites"
                className="relative"
                onClick={() => {
                  setShowInvites(true);
                  if (invitesQuery.isSuccess && pendingInvites.length === 0) {
                    toast.info("No pending invites");
                  }
                }}
                disabled={!currentUser}
                title={
                  invitesQuery.isLoading ? "Loading invites..." : "Open invites"
                }
              >
                <Inbox className="mr-1 h-4 w-4" />
                Invites
                {pendingInvites.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-2 h-5 px-1.5 py-0 text-[10px]"
                    aria-label={`${pendingInvites.length} pending invites`}
                  >
                    {pendingInvites.length}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" align="end">
              View your invites
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Columns toggle */}
        <TooltipProvider delayDuration={150}>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" aria-label="Toggle Columns">
                    <Columns3Cog className="mr-1 h-4 w-4" />
                    {selectedCount ? `(${selectedCount})` : ""}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" align="end">
                Toggle Columns
              </TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {COLUMN_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.id}
                  checked={selected.has(opt.id)}
                  onCheckedChange={(checked) =>
                    toggle(opt.id, Boolean(checked))
                  }
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>
      </div>

      {/* Invites modal */}
      {showInvites && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setShowInvites(false)}
        >
          <div
            className="w-full max-w-2xl rounded-lg bg-background p-4 shadow-lg border"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Invites Modal"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold">Your Invites</h2>
                <p className="text-xs text-muted-foreground">
                  {pendingInvites.length} pending
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInvites(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-auto space-y-2">
              {invitesQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : invites.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invites.</p>
              ) : (
                invites.map((invite) => {
                  const created = invite.createdAt
                    ? new Date(invite.createdAt).toLocaleString()
                    : "";
                  const isPending = invite.status === "PENDING";
                  return (
                    <div
                      key={`invite-${invite.id}-${
                        invite.organizationId ?? "org"
                      }-${invite.teamId ?? "team"}`}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="min-w-0">
                        {invite.teamName ? (
                          <p className="text-sm font-medium truncate">
                            Invited to Team <strong>{invite.teamName}</strong> in Organization <strong>
                              {invite.organizationName ?? "Unknown"}
                            </strong>
                          </p>
                        ) : (
                          <p className="text-sm font-medium truncate">
                            Invited to Organization <strong>{invite.organizationName ?? "Unknown"}</strong>
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground truncate">
                          Role: {invite.teamName ? invite.teamRole ?? "MEMBER" : invite.orgRole ?? "MEMBER"}
                        </p>
                        <p className="text-xs text-muted-foreground">Created: {created}</p>
                        {isPending ? (
                          <Badge variant="destructive" className="mt-1">Pending</Badge>
                        ) : (
                          <Badge className="mt-1">{invite.status}</Badge>
                        )}
                      </div>
                      <div className="ml-3 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => acceptInvite.mutate(invite)}
                          disabled={!isPending || acceptInvite.isPending}
                        >
                          {acceptInvite.isPending ? "Accepting…" : "Accept"}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {invites.length > 0 && pendingInvites.length === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                No pending invites.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
