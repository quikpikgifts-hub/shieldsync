// Some drivers (pg/Prisma, ioredis) can embed a connection string — including its
// credentials — in a connection-failure error's message/stack. This is the single choke
// point every "log an unexpected error" call site routes through, so a leak only needs
// closing once. See docs/ember/LOGGING_AUDIT.md.
const CREDENTIALS_IN_URL = /([a-z][a-z0-9+.-]*:\/\/[^\s:/@]+):[^\s@/]+@/gi;

export function safeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? (error.stack ?? error.message) : String(error);
  return raw.replace(CREDENTIALS_IN_URL, "$1:***@");
}
