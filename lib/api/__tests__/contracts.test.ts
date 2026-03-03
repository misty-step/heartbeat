import { describe, expect, it } from "vitest";
import {
  API_IDEMPOTENCY_REPLAY_WINDOW_HOURS,
  IDEMPOTENCY_KEY_HEADER,
  buildPaginatedResponse,
  buildProblemDetails,
} from "@/lib/api/contracts";

describe("API contracts", () => {
  it("builds RFC 9457 style problem details without extensions", () => {
    const problem = buildProblemDetails({
      type: "https://heartbeat.dev/problems/unauthorized",
      title: "Unauthorized",
      status: 401,
      detail: "Invalid API key",
      instance: "/api/v1/me",
    });

    expect(problem).toEqual({
      type: "https://heartbeat.dev/problems/unauthorized",
      title: "Unauthorized",
      status: 401,
      detail: "Invalid API key",
      instance: "/api/v1/me",
    });
  });

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

  it("prevents extensions from overriding canonical problem fields", () => {
    const problem = buildProblemDetails({
      type: "https://heartbeat.dev/problems/conflict",
      title: "Conflict",
      status: 409,
      detail: "Idempotency key conflict",
      instance: "/api/v1/monitors",
      extensions: {
        title: "Wrong title",
        status: 200,
      },
    });

    expect(problem.title).toBe("Conflict");
    expect(problem.status).toBe(409);
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

  it("builds terminal paginated responses with null cursor and empty data", () => {
    const response = buildPaginatedResponse<string>([], null, 50);
    expect(response).toEqual({
      data: [],
      page: {
        limit: 50,
        nextCursor: null,
      },
    });
  });

  it("publishes idempotency contract constants", () => {
    expect(IDEMPOTENCY_KEY_HEADER).toBe("Idempotency-Key");
    expect(API_IDEMPOTENCY_REPLAY_WINDOW_HOURS).toBe(24);
  });
});
