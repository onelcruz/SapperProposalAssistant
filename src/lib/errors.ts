import { NextResponse } from "next/server";

export type ApiError = {
  error: string;
  code: string;
};

export class ApiRouteError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ScannedPdfError extends ApiRouteError {
  constructor(message = "The PDF appears to be scanned or image-only and cannot be indexed.") {
    super(message, "SCANNED_PDF", 422);
  }
}

export class CorruptedFileError extends ApiRouteError {
  constructor(message = "The file could not be parsed. It may be corrupted or password protected.") {
    super(message, "CORRUPTED_FILE", 422);
  }
}

export class DuplicateDocumentError extends ApiRouteError {
  constructor(message = "This document has already been uploaded for the current workspace.") {
    super(message, "DUPLICATE_DOCUMENT", 409);
  }
}

export class UnsupportedMediaTypeError extends ApiRouteError {
  constructor(message: string, code = "UNSUPPORTED_MEDIA_TYPE", status = 415) {
    super(message, code, status);
  }
}

export class WorkspaceResolutionError extends ApiRouteError {
  constructor(message = "An active Clerk organization is required for this operation.") {
    super(message, "WORKSPACE_REQUIRED", 403);
  }
}

export class ForbiddenError extends ApiRouteError {
  constructor(message = "You do not have access to this company resource.") {
    super(message, "FORBIDDEN", 403);
  }
}

export function toApiError(error: unknown): { status: number; body: ApiError } {
  if (error instanceof ApiRouteError) {
    return {
      status: error.status,
      body: {
        error: error.message,
        code: error.code,
      },
    };
  }

  console.error(error);

  return {
    status: 500,
    body: {
      error: "An unexpected error occurred.",
      code: "INTERNAL_SERVER_ERROR",
    },
  };
}

export function errorResponse(error: unknown) {
  const { status, body } = toApiError(error);
  return NextResponse.json(body, { status });
}
