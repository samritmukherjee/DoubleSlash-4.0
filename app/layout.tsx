import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { OnboardingProvider } from "./components/Onboarding/OnboardingContext";
import {
  ClerkProvider,
} from '@clerk/nextjs'
import '@fontsource/google-sans-flex';

export const metadata: Metadata = {
  title: "OutreachX",
  description: "Start your digital campaigns with OutreachX.",
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
          <body>
            <Navbar />
            {children}
          </body>
        </html>
      </OnboardingProvider>
    </ClerkProvider>
  )
}
