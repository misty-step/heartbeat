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

  it("rejects non-HTTP status values for problem details", () => {
    expect(() =>
      buildProblemDetails({
        type: "https://heartbeat.dev/problems/internal",
        title: "Internal error",
        status: 700,
        detail: "Unexpected condition",
        instance: "/api/v1/monitors",
      }),
    ).toThrow("ProblemDetails status must be an integer between 100 and 599");
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

  it("rejects pagination limits outside documented contract bounds", () => {
    expect(() => buildPaginatedResponse([], null, 0)).toThrow(
      "Pagination limit must be an integer between 1 and 200",
    );
    expect(() => buildPaginatedResponse([], null, 201)).toThrow(
      "Pagination limit must be an integer between 1 and 200",
    );
    expect(() => buildPaginatedResponse([], null, 1.5)).toThrow(
      "Pagination limit must be an integer between 1 and 200",
    );
  });

  it("accepts pagination limit boundary values", () => {
    expect(buildPaginatedResponse([], null, 1).page.limit).toBe(1);
    expect(buildPaginatedResponse([], null, 200).page.limit).toBe(200);
  });

  it("publishes idempotency contract constants", () => {
    expect(IDEMPOTENCY_KEY_HEADER).toBe("Idempotency-Key");
    expect(API_IDEMPOTENCY_REPLAY_WINDOW_HOURS).toBe(24);
  });
});
