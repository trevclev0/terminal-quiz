import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/selector")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/selector"!</div>;
}
