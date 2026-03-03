export const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";
export const API_IDEMPOTENCY_REPLAY_WINDOW_HOURS = 24;

export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
} & Record<string, unknown>;

export type ProblemDetailsInput = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
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
  const { extensions, ...base } = input;
  return {
    ...base,
    ...(extensions ?? {}),
  };
}

export function buildPaginatedResponse<T>(
  data: T[],
  nextCursor: string | null,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    page: {
      limit,
      nextCursor,
    },
  };
}
