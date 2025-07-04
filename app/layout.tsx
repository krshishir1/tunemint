import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

import Web3Provider from "@/components/Web3Provider";
import AccountProvider from "@/components/AccountProvider";
import { Navigation } from "@/components/Navigation";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Tunemint",
  description: "IP Licensing For Music Creators",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        {/* <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        > */}
          <Web3Provider>
            <AccountProvider>
              <Navigation />
              {children}
            </AccountProvider>
          </Web3Provider>
        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
