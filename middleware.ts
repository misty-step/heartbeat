import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/terms",
  "/privacy",
  "/pricing",
  "/status(.*)",
  "/s(.*)", // Public status pages at /s/[slug]
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/logs", // Public endpoint for client log batching
  "/api/stripe/webhook", // Stripe webhook endpoint
  "/design-lab(.*)", // Design lab for reviewing variations
]);

export default clerkMiddleware(async (auth, request) => {
  // Generate correlation ID for request tracing
  const requestId = crypto.randomUUID();

  // Clone headers and add correlation ID
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Pass correlation ID to response headers for debugging
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("x-request-id", requestId);

  return response;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
