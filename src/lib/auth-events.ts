export const AUTH_SESSION_EXPIRED_EVENT = "urinest:auth-session-expired";

export interface AuthSessionExpiredDetail {
  context: string;
  message: string;
}

export function emitAuthSessionExpired(detail: AuthSessionExpiredDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AuthSessionExpiredDetail>(AUTH_SESSION_EXPIRED_EVENT, { detail }),
  );
}
