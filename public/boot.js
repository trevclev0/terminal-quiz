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

window.addEventListener(
  "error",
  () => {
    if (!document.getElementById("boot-fallback")) return;
    const root = document.getElementById("app-root");
    if (root) {
      root.innerHTML =
        '<div id="boot-fallback"><div><span class="inverse">LOAD FAILURE</span></div><div>Failed to initialize terminal. Check environment.</div><div><a class="reload" href="/">[ RELOAD ]</a></div></div>';
    }
    try {
      // Session identity is a server-issued HttpOnly cookie; nothing
      // to read or generate client-side.
      const payload = JSON.stringify({
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
