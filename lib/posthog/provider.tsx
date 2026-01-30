"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";

// Module-level initialization: PostHog SDK initializes when this file is imported.
// This is intentional - analytics should start before React hydration completes.
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "/ingest",
    ui_host: "https://us.posthog.com",
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage",
    disable_session_recording: process.env.NODE_ENV !== "production",
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-ph-mask]",
    },
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") {
        ph.debug();
      }
    },
  });
}

function PageViewTracker(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!pathname || !ph) return;

    const search = searchParams.toString();
    const url = window.origin + pathname + (search ? `?${search}` : "");
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}

function UserIdentifier(): null {
  const { user, isLoaded } = useUser();
  const ph = usePostHog();

  useEffect(() => {
    if (!isLoaded || !ph) return;

    if (user) {
      ph.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        created_at: user.createdAt,
      });
    } else {
      ph.reset();
    }
  }, [user, isLoaded, ph]);

  return null;
}

export function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <UserIdentifier />
      {children}
    </PHProvider>
  );
}
