import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OnboardingProvider } from "@/components/Onboarding/OnboardingContext";
import {
  ClerkProvider,
} from '@clerk/nextjs'
import '@fontsource/google-sans-flex';
import Clarity from "./Clarity";
export const metadata: Metadata = {
  title: "OutreachX",
  description: "Start your digital campaigns with OutreachX.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <OnboardingProvider>
        <html lang="en">
          <body suppressHydrationWarning>
            {children}
            <Clarity />
          </body>
        </html>
      </OnboardingProvider>
    </ClerkProvider>
  )
}
