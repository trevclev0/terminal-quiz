const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86_400;

// Clamped rather than signed: a run start stamped slightly after "now"
// (clock skew between writes) should read as 0s, not a negative duration.
export default function formatElapsed(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));

  if (total < SECONDS_PER_MINUTE) {
    return `${total}s`;
  }

  if (total < SECONDS_PER_HOUR) {
    const minutes = Math.floor(total / SECONDS_PER_MINUTE);
    const rest = total % SECONDS_PER_MINUTE;
    return `${minutes}m ${String(rest).padStart(2, "0")}s`;
  }

  if (total < SECONDS_PER_DAY) {
    const hours = Math.floor(total / SECONDS_PER_HOUR);
    const minutes = Math.floor((total % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
    return `${hours}h ${minutes}m`;
  }

  const days = Math.floor(total / SECONDS_PER_DAY);
  const hours = Math.floor((total % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
  return `${days}d ${hours}h`;
}
