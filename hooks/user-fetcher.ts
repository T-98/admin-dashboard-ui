import { SearchParams, PaginatedResponse } from "./usePaginatedUsers";
import axios from "axios";

export async function userFetcher(
  searchParams: SearchParams,
  nextCursorValue: string | null
) {
  const res = await axios.get<PaginatedResponse>(
    "http://localhost:3000/api/users/search",
    {
      params: {
        ...searchParams,
        nextCursor: nextCursorValue,
      },
      headers: {
        "x-email": "kennith77@hotmail.com",
        "x-password": "password123",
      },
    }
  );
  return res.data;
};

export type { PaginatedResponse, SearchParams };