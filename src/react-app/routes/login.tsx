import LoginPage from "@components/LoginPage";
import { createFileRoute } from "@tanstack/react-router";

type LoginSearch = {
  return_to?: string;
};

const ALLOWED_REDIRECT_PATHS = ["/programs/select", "/"];
const ALLOWED_REDIRECT_PREFIXES = ["/programs/manage"];

export function validateReturnTo(value: string): string | undefined {
  try {
    if (value.includes("\\")) return undefined;
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return undefined;
    if (!url.pathname.startsWith("/")) return undefined;
    if (url.pathname.includes("//")) return undefined;
    return url.pathname + url.search;
  } catch {
    return undefined;
  }
}

export function isAllowedPath(path: string): boolean {
  const cleanPath = path.split("?")[0];
  if (ALLOWED_REDIRECT_PATHS.includes(cleanPath)) return true;
  for (const prefix of ALLOWED_REDIRECT_PREFIXES) {
    if (cleanPath.startsWith(prefix)) return true;
  }
  return false;
}

export function validateLoginSearch(
  search: Record<string, unknown>,
): LoginSearch {
  const raw =
    typeof search.return_to === "string" ? search.return_to : undefined;
  const valid = raw ? validateReturnTo(raw) : undefined;
  return {
    return_to: valid && isAllowedPath(valid) ? valid : undefined,
  };
}

export const Route = createFileRoute("/login")({
  validateSearch: validateLoginSearch,
  component: () => {
    const { return_to } = Route.useSearch();
    return <LoginPage redirectTo={return_to} />;
  },
});
