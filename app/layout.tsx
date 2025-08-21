// app/layout.tsx
import "../styles/globals.css"; // or "../styles/globals.css" if that’s your path
import Providers from "./providers";

export const metadata = {
  title: "Admin Dashboard",
  description: "A simple admin dashboard for user management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
