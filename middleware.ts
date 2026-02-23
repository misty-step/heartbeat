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
  "/api/health", // Health check for uptime monitoring
  "/design-lab(.*)", // Design lab for reviewing variations
  "/explore(.*)", // Design exploration catalogue
  // Note: Stripe webhooks now go directly to Convex HTTP action
]);

export default clerkMiddleware(async (auth, request) => {
  // Generate correlation ID for request tracing
  const requestId = crypto.randomUUID();

  // Clone headers and add correlation ID
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  // Redirect authenticated users from landing page to dashboard
  // Minimizes friction - signed-in users go straight to their monitors
  if (request.nextUrl.pathname === "/") {
    const { userId } = await auth();
    if (userId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

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
