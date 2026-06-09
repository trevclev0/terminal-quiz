import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/select")({
  component: SelectComponent,
});

function SelectComponent() {
  return <h2>Hello "/select"!</h2>;
}
