import { describe, expect, it } from "vitest";
import {
  API_IDEMPOTENCY_REPLAY_WINDOW_HOURS,
  IDEMPOTENCY_KEY_HEADER,
  buildPaginatedResponse,
  buildProblemDetails,
} from "@/lib/api/contracts";

describe("API contracts", () => {
  it("builds RFC 9457 style problem details with extensions", () => {
    const problem = buildProblemDetails({
      type: "https://heartbeat.dev/problems/not-found",
      title: "Monitor not found",
      status: 404,
      detail: "No monitor exists for this id",
      instance: "/api/v1/monitors/mon_123",
      extensions: {
        requestId: "req_123",
      },
    });

    expect(problem).toEqual({
      type: "https://heartbeat.dev/problems/not-found",
      title: "Monitor not found",
      status: 404,
      detail: "No monitor exists for this id",
      instance: "/api/v1/monitors/mon_123",
      requestId: "req_123",
    });
  });

  it("builds paginated responses with deterministic metadata", () => {
    const response = buildPaginatedResponse(["a", "b"], "cursor_2", 2);
    expect(response).toEqual({
      data: ["a", "b"],
      page: {
        limit: 2,
        nextCursor: "cursor_2",
      },
    });
  });

  it("publishes idempotency contract constants", () => {
    expect(IDEMPOTENCY_KEY_HEADER).toBe("Idempotency-Key");
    expect(API_IDEMPOTENCY_REPLAY_WINDOW_HOURS).toBe(24);
  });
});
