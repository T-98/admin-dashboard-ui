// pages/users.tsx
import UserListContainer from "@/components/UserListContainer";

export default function UsersPage() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">User Directory</h1>
      <UserListContainer
        q="Ca"
        sortBy="name"
        order="asc"
        take={10}
        filterBy="ADMIN"
      />
    </main>
  );
}
