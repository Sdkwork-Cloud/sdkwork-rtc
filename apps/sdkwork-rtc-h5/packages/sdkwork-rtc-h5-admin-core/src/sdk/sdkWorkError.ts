export interface SdkWorkProblemDetail {
  code: number;
  traceId: string;
  title?: string;
  detail?: string;
  status?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasProblemDetailShape(value: Record<string, unknown>): boolean {
  return typeof value.code === "number" && typeof value.traceId === "string" && value.traceId.length > 0;
}

function normalizeProblemDetail(value: Record<string, unknown>): SdkWorkProblemDetail {
  return {
    code: value.code as number,
    traceId: value.traceId as string,
    title: typeof value.title === "string" ? value.title : undefined,
    detail: typeof value.detail === "string" ? value.detail : undefined,
    status: typeof value.status === "number" ? value.status : undefined,
  };
}

export function readSdkWorkProblemDetail(error: unknown): SdkWorkProblemDetail | undefined {
  if (!error) {
    return undefined;
  }

  if (isRecord(error)) {
    if (hasProblemDetailShape(error)) {
      return normalizeProblemDetail(error);
    }

    for (const key of ["body", "data", "problem", "cause"] as const) {
      const nested = error[key];
      if (isRecord(nested) && hasProblemDetailShape(nested)) {
        return normalizeProblemDetail(nested);
      }
    }

    if (isRecord(error.response)) {
      return readSdkWorkProblemDetail(error.response.data ?? error.response.body);
    }
  }

  if (error instanceof Error && error.cause) {
    return readSdkWorkProblemDetail(error.cause);
  }

  return undefined;
}

export function formatSdkWorkError(error: unknown, fallback = "Request failed"): string {
  const problem = readSdkWorkProblemDetail(error);
  if (problem) {
    const message = problem.detail?.trim() || problem.title?.trim() || fallback;
    return `${message} (code: ${problem.code}, traceId: ${problem.traceId})`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
