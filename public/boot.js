// Cloudflare Web Analytics — production hostname only, so preview and local
// traffic don't contaminate the dedicated quiz dashboard.
if (window.location.hostname === "quiz.clevertrevor.dev") {
  const beacon = document.createElement("script");
  beacon.defer = true;
  beacon.src = "https://static.cloudflareinsights.com/beacon.min.js";
  beacon.dataset.cfBeacon = JSON.stringify({
    token: "7c7b1bf0bc1d454aa3a55a053b52618f",
  });
  document.head.appendChild(beacon);
}

window.addEventListener("DOMContentLoaded", () => {
  const bootFallback = document.getElementById("boot-fallback");
  if (bootFallback) {
    window.setTimeout(() => bootFallback.classList.remove("dn"), 0);
  }
});

function makeSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for browsers without crypto.randomUUID (pre-2021) using
  // cryptographically secure randomness — never Math.random.
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
  }
  // No crypto at all (insecure context) — empty id, which trackEvent
  // drops. Unreachable on the https deployment.
  return "";
}

window.addEventListener(
  "error",
  () => {
    if (!document.getElementById("boot-fallback")) return;
    const root = document.getElementById("app-root");
    if (root) {
      root.innerHTML =
        '<div id="boot-fallback"><div><span class="inverse">LOAD FAILURE</span></div><div>Failed to initialize terminal. Check connection.</div><div><a class="reload" href="/">[ RELOAD ]</a></div></div>';
    }
    try {
      // Storage access is isolated from the beacon so a storage
      // exception cannot swallow the telemetry that exists precisely
      // because the app failed to boot.
      let sessionId = "";
      try {
        sessionId = localStorage.getItem("terminal_quiz_session_id") || "";
      } catch {
        // Storage unavailable — the generated id still identifies the event.
      }
      if (!sessionId) {
        sessionId = makeSessionId();
        try {
          localStorage.setItem("terminal_quiz_session_id", sessionId);
        } catch {
          // Storage unavailable — in-memory id lives for this beacon only.
        }
      }
      const payload = JSON.stringify({
        sessionId,
        source: "boot",
        message: "bootstrap load failure",
        path: window.location.pathname,
      });
      navigator.sendBeacon("/api/error", payload);
    } catch {
      // Telemetry must never break the boot failure UI.
    }
  },
  true,
);
