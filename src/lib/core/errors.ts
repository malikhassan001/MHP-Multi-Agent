export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "PROVIDER_ERROR"
  | "RENDER_ERROR"
  | "JOB_ERROR"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  RATE_LIMITED: 429,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  PROVIDER_ERROR: 502,
  RENDER_ERROR: 500,
  JOB_ERROR: 500,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly details?: unknown;
  public readonly expose: boolean;

  constructor(code: ErrorCode, message: string, details?: unknown, expose = true) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
    this.expose = expose;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.expose ? this.details : undefined,
      },
    };
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError("BAD_REQUEST", message, details);

export const unauthorized = (message = "Authentication required") =>
  new AppError("UNAUTHORIZED", message);

export const forbidden = (message = "Access denied") => new AppError("FORBIDDEN", message);

export const notFound = (message = "Resource not found") => new AppError("NOT_FOUND", message);

export const conflict = (message: string) => new AppError("CONFLICT", message);

export const validationError = (message: string, details?: unknown) =>
  new AppError("VALIDATION_ERROR", message, details);

export const providerError = (message: string, details?: unknown) =>
  new AppError("PROVIDER_ERROR", message, details);

export const renderError = (message: string, details?: unknown) =>
  new AppError("RENDER_ERROR", message, details);

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) {
    return new AppError("INTERNAL_ERROR", err.message, undefined, false);
  }
  return new AppError("INTERNAL_ERROR", "Unknown error", undefined, false);
}