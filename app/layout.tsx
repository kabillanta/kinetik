import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "KinetiK | Graph-Powered Volunteer Matching",
  description: "Connect your skills with community events through intelligent graph-based matching. KinetiK uses Neo4j to match developers, designers, and builders with opportunities that need their exact expertise.",
  keywords: ["volunteer", "matching", "graph database", "neo4j", "community", "hackathon", "events"],
  openGraph: {
    title: "KinetiK | Graph-Powered Volunteer Matching",
    description: "Connect your skills with community events through intelligent graph-based matching.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} scroll-smooth`}>
      <body className="font-sans antialiased bg-white">
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
