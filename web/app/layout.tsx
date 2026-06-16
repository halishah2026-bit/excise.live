import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Excise.Live - Vehicle Verification",
  description: "Excise.Live - Vehicle Verification Portal for Pakistan",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
