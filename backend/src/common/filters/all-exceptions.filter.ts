import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
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
      };

      if (status >= 500) {
        this.logger.error(`${request.method} ${request.url} -> ${status}`, exception.stack);
      }

      response.status(status).json(body);
      return;
    }

    // Unknown/unhandled error: log everything server-side, expose nothing client-side.
    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    const body: ErrorResponseBody = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "An unexpected error occurred.",
      error: "Internal Server Error",
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}
