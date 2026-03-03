const SESSION_KEY = "voting_session_id";
const VOTED_KEY = "has_voted";

export function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function hasVoted(): boolean {
  return localStorage.getItem(VOTED_KEY) === "true";
}

export function markAsVoted(): void {
  localStorage.setItem(VOTED_KEY, "true");
}
