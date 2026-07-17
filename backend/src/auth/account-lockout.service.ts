import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { KEY_VALUE_STORE, type KeyValueStore } from "../redis/key-value-store.interface";
import type { AppConfig } from "../config/configuration";

export interface LockoutStatus {
  locked: boolean;
  retryAfterSeconds?: number;
}

/**
 * Per-account brute-force protection, independent of the existing IP-based throttle on
 * POST /auth/login (SECURITY_AUDIT.md H-2 — the IP throttle alone does nothing against an
 * attacker rotating source IPs against one specific victim account).
 *
 * Keyed on the *normalized email string as submitted*, not the resolved user ID — this is
 * deliberate: it means a nonexistent account gets exactly the same lockout behavior as a
 * real one after N attempts, so the lockout mechanism itself can't be used as an
 * account-enumeration side channel (an attacker probing random addresses learns nothing
 * about which ones are real from lockout behavior alone).
 */
@Injectable()
export class AccountLockoutService {
  private readonly threshold: number;
  private readonly windowSeconds: number;
  private readonly lockoutSeconds: number;

  constructor(
    @Inject(KEY_VALUE_STORE) private readonly store: KeyValueStore,
    configService: ConfigService,
  ) {
    const security = configService.getOrThrow<AppConfig["security"]>("app.security");
    this.threshold = security.loginLockoutThreshold;
    this.windowSeconds = security.loginLockoutWindowMinutes * 60;
    this.lockoutSeconds = security.loginLockoutDurationMinutes * 60;
  }

  async checkLocked(identifier: string): Promise<LockoutStatus> {
    const retryAfterSeconds = await this.store.ttl(this.lockKey(identifier));
    if (retryAfterSeconds !== null) {
      return { locked: true, retryAfterSeconds };
    }
    return { locked: false };
  }

  /** Returns the resulting lockout status after recording this failure. */
  async recordFailure(identifier: string): Promise<LockoutStatus> {
    const attempts = await this.store.incrWithExpiry(this.attemptsKey(identifier), this.windowSeconds);
    if (attempts >= this.threshold) {
      await this.store.set(this.lockKey(identifier), "1", this.lockoutSeconds);
      return { locked: true, retryAfterSeconds: this.lockoutSeconds };
    }
    return { locked: false };
  }

  async recordSuccess(identifier: string): Promise<void> {
    await this.store.del(this.attemptsKey(identifier));
    await this.store.del(this.lockKey(identifier));
  }

  private attemptsKey(identifier: string): string {
    return `lockout:attempts:${identifier}`;
  }

  private lockKey(identifier: string): string {
    return `lockout:locked:${identifier}`;
  }
}
