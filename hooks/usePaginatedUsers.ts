// hooks/usePaginatedUsers.ts
export interface Org {
  orgId: number;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
}

export interface Team {
  teamId: number;
  name: string;
  role: "LEAD" | "MEMBER" | "VIEWER";
  orgId: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  organizationIds: number[];
  teamIds: number[];
  orgs: Org[];
  teams: Team[];
}

export interface SearchParams {
  q?: string;
  sortBy?: "mostRelevant" | "name" | "email" | "creationDate";
  order?: "asc" | "desc";
  take?: number;
  // new name-based filters:
  organizationName?: string;
  teamName?: string;
}

export interface PaginatedResponse {
  users: User[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}
