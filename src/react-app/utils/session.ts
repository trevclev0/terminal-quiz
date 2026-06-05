const SESSION_KEY = "terminal_quiz_session_id";

let memorySessionId: string | null = null;
export const getSessionId = (): string => {
  try {
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch {
    if (!memorySessionId) {
      memorySessionId = crypto.randomUUID();
    }
    return memorySessionId;
  }
};
