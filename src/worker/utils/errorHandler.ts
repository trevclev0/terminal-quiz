// src/worker/utils/errorHandler.ts
export interface D1Error {
  message?: string;
  cause?: unknown;
  code?: string;
}

export const logError = (err: Error, method: string, path: string) => {
  console.error(`[Error on ${method} ${path}]:`, err.message || err);
  if (err.cause) {
    const cause = err.cause as D1Error;
    console.error("Underlying D1 Cause:", cause.message || cause);
  }
};

export const formatErrorResponse = (err: Error, path: string) => {
  if (path.startsWith("/api/graphql")) {
    return {
      errors: [{ message: err.message || "Internal Server Error" }],
    };
  }
  return {
    status: "error",
    message: "Server Error",
    code: "INTERNAL_SERVER_ERROR",
  };
};
