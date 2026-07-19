import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { captureException } from "../../observability/sentry";
import { safeErrorMessage } from "../logging/safe-error";

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
  requestId?: string;
}

function requestIdOf(request: Request): string | undefined {
  // Assigned by pino-http (see observability/logger.module.ts's genReqId) — reading it
  // defensively since this filter must never itself throw regardless of what's attached
  // a request.
  return (request as unknown as { id?: string }).id;
}

/**
 * Secure error handling: known HttpExceptions (validation errors, 404s, 403s, etc.) pass
 * their intended client-facing message through unchanged. Anything else — a genuine bug,
 * a database error, an unhandled rejection — is logged in full server-side but returns
 * only a generic message to the client. Stack traces, database error text, and internal
 * exception details must never reach an HTTP response body.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === "string"
          ? exceptionResponse
          : ((exceptionResponse as { message?: string | string[] }).message ??
            exception.message);

      const body: ErrorResponseBody = {
        statusCode: status,
        message,
        error: HttpStatus[status] ?? "Error",
        path: request.url,
        timestamp: new Date().toISOString(),
        requestId: requestIdOf(request),
      };

      if (status >= 500) {
        this.logger.error(`${request.method} ${request.url} -> ${status}`, safeErrorMessage(exception));
        // Only true 5xx HttpExceptions are reported — a 400/401/403/404 is expected,
        // client-facing behavior, not an operational error worth paging anyone over.
        captureException(exception);
      }

      response.status(status).json(body);
      return;
    }

    // Unknown/unhandled error: log everything server-side, expose nothing client-side.
    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url}`,
      safeErrorMessage(exception),
    );
    captureException(exception);

    const body: ErrorResponseBody = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "An unexpected error occurred.",
      error: "Internal Server Error",
      path: request.url,
      timestamp: new Date().toISOString(),
      requestId: requestIdOf(request),
    };

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}
