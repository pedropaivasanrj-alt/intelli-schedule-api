import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intelli Schedule",
  description: "Sistema de agendamento acadêmico",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
