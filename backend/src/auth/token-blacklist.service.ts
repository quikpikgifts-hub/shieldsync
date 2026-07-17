import { Inject, Injectable } from "@nestjs/common";
import { KEY_VALUE_STORE, type KeyValueStore } from "../redis/key-value-store.interface";

/**
 * Access tokens are re-validated against live `Users.status` on every request
 * (`JwtStrategy.validate()` — see SECURITY_AUDIT.md C-1), which correctly handles bans.
 * It does NOT handle "log out this one session right now" — a user who explicitly logs
 * out has their refresh token revoked immediately, but the access token they were holding
 * remains cryptographically valid (and would still pass the status check, since the
 * account itself is still ACTIVE) until it naturally expires, up to JWT_ACCESS_TTL later.
 * This closes that gap: every access token gets a random `jti` claim, and logout
 * blacklists that one jti for exactly as long as the token would otherwise have been
 * valid — no longer, since there's no reason to remember it after it would have expired
 * anyway.
 */
@Injectable()
export class TokenBlacklistService {
  constructor(@Inject(KEY_VALUE_STORE) private readonly store: KeyValueStore) {}

  async blacklist(jti: string, remainingTtlSeconds: number): Promise<void> {
    if (remainingTtlSeconds <= 0) return; // already expired on its own; nothing to do
    await this.store.set(this.key(jti), "1", remainingTtlSeconds);
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    return (await this.store.get(this.key(jti))) !== null;
  }

  private key(jti: string): string {
    return `blacklist:jti:${jti}`;
  }
}
