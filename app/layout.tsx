import type { Metadata } from "next";
import "../styles/globals.css";
import Providers from "./providers";
import { ClientToaster } from "./client-toaster";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "A simple admin dashboard for user management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <Providers>
          <div className="min-h-screen">
            {children}
            <ClientToaster />
          </div>
        </Providers>
      </body>
    </html>
  );
}
