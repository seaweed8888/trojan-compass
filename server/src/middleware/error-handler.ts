import type { ErrorRequestHandler } from "express";
import { AppError } from "../lib/errors.js";
export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (response.headersSent || response.destroyed) return;
  let publicError: AppError;
  if (error instanceof AppError) publicError = error;
  else if (error?.type === "entity.too.large")
    publicError = new AppError(
      "PAYLOAD_TOO_LARGE",
      413,
      "The request exceeds the one MiB JSON limit.",
    );
  else if (error?.type === "entity.parse.failed" || error instanceof URIError)
    publicError = new AppError(
      "INVALID_REQUEST",
      400,
      "The request contains malformed JSON or URL encoding.",
    );
  else if (
    error?.type === "encoding.unsupported" ||
    error?.type === "charset.unsupported"
  )
    publicError = new AppError(
      "UNSUPPORTED_MEDIA_TYPE",
      415,
      "Use uncompressed UTF-8 JSON.",
    );
  else
    publicError = new AppError(
      "INTERNAL_ERROR",
      500,
      "An internal error occurred. Use the request ID when reporting this issue.",
    );
  response.locals.errorCode = publicError.code;
  if (publicError.httpStatus >= 500) {
    // Source locations diagnose failures without logging messages, request bodies or credentials.
    const frames =
      error instanceof Error
        ? (error.stack ?? "")
            .split("\n")
            .filter((line) => /^\s+at /.test(line))
            .flatMap(
              (line) =>
                line.match(/([A-Za-z0-9_.-]+\.[cm]?[jt]s:\d+:\d+)\)?$/)?.[1] ??
                [],
            )
            .slice(0, 12)
        : [];
    response.locals.errorDiagnostic = {
      type:
        error instanceof Error &&
        /^[A-Za-z]{1,64}$/.test(error.constructor.name)
          ? error.constructor.name
          : "UnknownError",
      ...(typeof error?.code === "string" && /^[A-Z_]{1,64}$/.test(error.code)
        ? { code: error.code }
        : {}),
      frames,
    };
  }
  if (publicError.code === "RATE_LIMITED" && !response.hasHeader("Retry-After"))
    response.setHeader("Retry-After", "5");
  response.setHeader("Cache-Control", "no-store");
  response.status(publicError.httpStatus).json({
    error: {
      code: publicError.code,
      message: publicError.message,
      requestId: response.locals.scope.requestId,
      ...(publicError.fieldErrors
        ? { fieldErrors: publicError.fieldErrors }
        : {}),
      ...(publicError.details ? { details: publicError.details } : {}),
    },
  });
};
