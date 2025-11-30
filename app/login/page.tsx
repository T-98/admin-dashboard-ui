import LoginForm from "@/components/login/LoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>
      <h1 className="text-2xl font-bold">Log in</h1>
      <LoginForm />
    </main>
  );
}
