import type { Metadata } from "next";
import { Mulish, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UniSanté – Health Chatbot",
  description:
    "A UNICEF health information assistant covering HIV/AIDS, mental health, nutrition, vaccination, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${mulish.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-[var(--background)] font-sans text-[color:var(--foreground)] selection:bg-[#1CABE2]/25 selection:text-white">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
