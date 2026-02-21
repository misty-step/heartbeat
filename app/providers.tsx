"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useTheme, ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { PostHogProvider } from "@/lib/posthog";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud",
);

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      richColors
      theme={resolvedTheme as "light" | "dark" | "system"}
    />
  );
}

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
          <ThemedToaster />
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            {children}
          </ConvexProviderWithClerk>
        </ThemeProvider>
      </PostHogProvider>
    </ClerkProvider>
  );
}
