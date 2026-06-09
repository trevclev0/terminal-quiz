import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/select")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/selector"!</div>;
}
