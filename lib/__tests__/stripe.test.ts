import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @stripe/stripe-js
const mockLoadStripe = vi.fn();
vi.mock("@stripe/stripe-js", () => ({
  loadStripe: (key: string) => mockLoadStripe(key),
}));

// Need to import after mocking
let getStripe: typeof import("../stripe").getStripe;
let redirectToCheckout: typeof import("../stripe").redirectToCheckout;

describe("lib/stripe", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    // Re-import to reset singleton state
    const stripeModule = await import("../stripe");
    getStripe = stripeModule.getStripe;
    redirectToCheckout = stripeModule.redirectToCheckout;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  });

  describe("getStripe", () => {
    it("returns null when publishable key is not configured", async () => {
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      const result = await getStripe();

      expect(result).toBeNull();
      expect(mockLoadStripe).not.toHaveBeenCalled();
    });

    it("loads Stripe with publishable key", async () => {
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_123";
      const mockStripeInstance = { elements: vi.fn() };
      mockLoadStripe.mockResolvedValue(mockStripeInstance);

      const result = await getStripe();

      expect(mockLoadStripe).toHaveBeenCalledWith("pk_test_123");
      expect(result).toBe(mockStripeInstance);
    });

    it("returns cached instance on subsequent calls (singleton)", async () => {
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_123";
      const mockStripeInstance = { elements: vi.fn() };
      mockLoadStripe.mockResolvedValue(mockStripeInstance);

      const result1 = await getStripe();
      const result2 = await getStripe();

      expect(mockLoadStripe).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
    });
  });

  describe("redirectToCheckout", () => {
    it("redirects to session URL", async () => {
      const originalLocation = window.location;
      // @ts-expect-error - mocking window.location
      delete window.location;
      window.location = { href: "" } as Location;

      await redirectToCheckout("https://checkout.stripe.com/session_123");

      expect(window.location.href).toBe(
        "https://checkout.stripe.com/session_123",
      );

      window.location = originalLocation;
    });
  });
});
