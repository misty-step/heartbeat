export const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";
export const API_IDEMPOTENCY_REPLAY_WINDOW_HOURS = 24;

export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance: string;
} & Record<string, unknown>;

export type ProblemDetailsInput = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance: string;
  extensions?: Record<string, unknown>;
};

export type CursorPagination = {
  limit: number;
  nextCursor: string | null;
};

export type PaginatedResponse<T> = {
  data: T[];
  page: CursorPagination;
};

export function buildProblemDetails(
  input: ProblemDetailsInput,
): ProblemDetails {
  if (
    !Number.isInteger(input.status) ||
    input.status < 100 ||
    input.status > 599
  ) {
    throw new Error(
      "ProblemDetails status must be an integer between 100 and 599",
    );
  }

  const { extensions, ...base } = input;
  return {
    ...(extensions ?? {}),
    ...base,
  };
}

export function buildPaginatedResponse<T>(
  data: T[],
  nextCursor: string | null,
  limit: number,
): PaginatedResponse<T> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
    throw new Error("Pagination limit must be an integer between 1 and 200");
  }

  return {
    data,
    page: {
      limit,
      nextCursor,
    },
  };
}
