export interface D1Error {
  message?: string;
  cause?: unknown;
  code?: string;
}

export const logError = (
  err: Error,
  method: string,
  path: string,
  requestId?: string,
) => {
  const cause = err.cause as D1Error | undefined;
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      method,
      path,
      requestId,
      message: err.message || String(err),
      cause: cause?.message || (cause ? String(cause) : undefined),
    }),
  );
};

export const formatErrorResponse = (err: Error, path: string) => {
  if (path.startsWith("/api/graphql")) {
    console.error(err);
    return {
      errors: [{ message: "Internal Server Error" }],
    };
  }
  return {
    status: "error",
    message: "Server Error",
    code: "INTERNAL_SERVER_ERROR",
  };
};
