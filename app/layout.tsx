import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AmbientBackground from "@/components/layout/AmbientBackground";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import ScrollProgress from "@/components/layout/ScrollProgress";
import "./globals.css";

// Inter variable font — weights 400/500/600/700 used across the site.
const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hafidz — Fractional CTO & Full-Stack Engineer",
  description:
    "Fractional CTO and full-stack engineer. Architecture, delivery, and the engineering discipline that keeps products running.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <AmbientBackground />
        <ScrollProgress />
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
