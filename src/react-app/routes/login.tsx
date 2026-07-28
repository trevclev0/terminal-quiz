import LoginPage from "@components/LoginPage";
import { createFileRoute } from "@tanstack/react-router";

type LoginSearch = {
  return_to?: string;
};

const ALLOWED_REDIRECT_PATHS = ["/programs/select", "/"];

function validateReturnTo(value: string): string | undefined {
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return undefined;
    if (!url.pathname.startsWith("/")) return undefined;
    if (url.pathname.includes("//") || url.pathname.includes("\\"))
      return undefined;
    return url.pathname + url.search;
  } catch {
    return undefined;
  }
}

function validateLoginSearch(search: Record<string, unknown>): LoginSearch {
  const raw =
    typeof search.return_to === "string" ? search.return_to : undefined;
  const valid = raw ? validateReturnTo(raw) : undefined;
  return {
    return_to:
      valid && ALLOWED_REDIRECT_PATHS.includes(valid) ? valid : undefined,
  };
}

export const Route = createFileRoute("/login")({
  validateSearch: validateLoginSearch,
  component: () => {
    const { return_to } = Route.useSearch();
    return <LoginPage redirectTo={return_to ?? "/programs/select"} />;
  },
  ssr: false,
});
