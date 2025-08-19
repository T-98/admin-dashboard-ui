import { SearchParams, PaginatedResponse } from "./usePaginatedUsers";
import axios from "axios";

export async function userFetcher(params: SearchParams, pageParam: any) {

    const res = await axios.get<PaginatedResponse>(
      "http://localhost:3000/api/users/search",
      {
        params: {
          ...params,
          nextCursor: pageParam,
        },
        headers: {
          "x-email": "nick_mann@yahoo.com",
          "x-password": "password123",
        },
      }
    );
    return res.data;
};