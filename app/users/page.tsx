import { normalizeSearchParams } from "@/lib/normalizeSearchParams";
import UsersClient from "@/components/UsersClient";

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
      <h1 className="text-2xl font-bold mb-4">User Directory</h1>
      <UsersClient
        q={params.q}
        sortBy={params.sortBy}
        order={params.order}
        take={params.take}
      />
    </main>
  );
}
