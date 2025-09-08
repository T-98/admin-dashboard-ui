import { normalizeSearchParams } from "@/lib/normalizeSearchParams";
import UsersClient from "@/components/UsersClient";
import { Suspense } from "react";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

type RawSearchParams = Record<string, string | string[] | undefined>;
type MaybePromise<T> = T | Promise<T>;

// narrow both real Promises and thenables
function isThenable<T = unknown>(v: unknown): v is Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!v && typeof (v as any).then === "function";
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: MaybePromise<RawSearchParams>;
}) {
  const raw: RawSearchParams = isThenable<RawSearchParams>(searchParams)
    ? await searchParams
    : searchParams ?? {};

  const params = normalizeSearchParams(raw);

  return (
    <main className="max-w-full mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">User Directory</h1>
        <LogoutButton />
      </div>
      <Suspense fallback={<p>Loading...</p>}>
        <UsersClient
          q={params.q}
          sortBy={params.sortBy}
          order={params.order}
          take={params.take}
        />
      </Suspense>
    </main>
  );
}
