import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/select")({
  component: SelectComponent,
});

function SelectComponent() {
  return <div>Hello "/selector"!</div>;
}
