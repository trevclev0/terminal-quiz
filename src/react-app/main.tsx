import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { indexedDBMessagePackPersister, queryClient } from "@api/queryClient";
import ErrorBoundary from "@components/ErrorBoundary";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import App from "./App";

const rootElement = document.getElementById("app-root") as HTMLElement;

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: indexedDBMessagePackPersister }}
    >
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </PersistQueryClientProvider>
  </StrictMode>,
);
