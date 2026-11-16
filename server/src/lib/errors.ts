import type { FieldError } from "@trojan-compass/shared/api";

/** Only explicit, public messages cross the HTTP boundary. */
export class AppError extends Error {
  constructor(
    readonly code: string,
    readonly httpStatus: number,
    message: string,
    readonly fieldErrors?: FieldError[],
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const invalid = (message: string, field?: string) =>
  new AppError(
    "INVALID_REQUEST",
    400,
    message,
    field ? [{ field, message }] : undefined,
  );
export const missing = (resource: string) =>
  new AppError(
    "RESOURCE_NOT_FOUND",
    404,
    `${resource} was not found in this dataset.`,
  );
export const unavailable = () =>
  new AppError(
    "DEPENDENCY_UNAVAILABLE",
    503,
    "A required service is temporarily unavailable.",
  );
export const timeout = () =>
  new AppError(
    "DEPENDENCY_TIMEOUT",
    504,
    "The request exceeded its time budget.",
  );
export const disabled = (message: string) =>
  new AppError("FEATURE_DISABLED", 501, message);
export const dataError = (message: string) =>
  new Error(`Invalid dataset: ${message}`);
