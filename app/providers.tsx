"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ThemeProvider } from "next-themes";
import { PostHogProvider } from "@/lib/posthog";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud",
);

export function Providers({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <PostHogProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            {children}
          </ConvexProviderWithClerk>
        </ThemeProvider>
      </PostHogProvider>
    </ClerkProvider>
  );
}
