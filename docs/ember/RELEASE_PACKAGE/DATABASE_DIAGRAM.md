# Ember — Database Diagram

The real schema — matches `backend/prisma/schema.prisma` exactly (this diagram is the same
one in `../DATABASE_SCHEMA.md`, reproduced here for the release package; that document is
still the authoritative column-by-column reference).

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : "assigned via"
    ROLES ||--o{ ROLE_PERMISSIONS : has
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : "granted via"
    USERS ||--o| PROFILES : has
    USERS ||--o| PREFERENCES : has
    USERS ||--o{ SESSIONS : has
    SESSIONS ||--o{ REFRESH_TOKENS : has
    USERS ||--o{ VERIFICATION_TOKENS : has
    PROFILES ||--o{ PHOTOS : has
    PROFILES ||--o{ PROMPT_ANSWERS : has
    USERS ||--o{ LIKES : performs
    USERS ||--o{ MATCHES : "user_a"
    USERS ||--o{ MATCHES : "user_b"
    MATCHES ||--o| CONVERSATIONS : has
    CONVERSATIONS ||--o{ MESSAGES : contains
    USERS ||--o{ MESSAGES : sends
    USERS ||--o{ REPORTS : files
    USERS ||--o{ REPORTS : "is subject of"
    REPORTS }o--o| MODERATION_CASES : "aggregates into"
    USERS ||--o{ MODERATION_CASES : "is subject of"
    USERS ||--o{ BLOCKS : creates
    USERS ||--o{ SUBSCRIPTIONS : holds
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ AUDIT_LOGS : "is actor in"
```

## Notable design decisions this diagram encodes

- **RBAC is four join tables**, not a `role` column on `users` — `roles`/`permissions` are
  independently seeded (4 roles, 8 permissions), and a user's actual permissions are
  checked live against the database on every guarded request, never cached in a JWT.
- **Messages hang off a `conversations` table, not directly off `matches`** — every match
  has exactly one conversation; this extra hop isn't in the original planning document and
  is easy to miss if working from memory rather than the real schema.
- **`reports` and `moderation_cases` use `onDelete: Restrict`** on their user foreign keys,
  deliberately — a future account-deletion feature can't silently erase the safety trail by
  cascading a delete through it.
- **Not built yet** (real product needs, tracked in `../ROADMAP.md`, not represented above):
  identity-verification records, a dedicated device/login-event table (new-device
  detection is real but implemented via `sessions`, not a separate table), safety
  check-ins, trusted contacts, consent records, data-export/erasure request tracking.

Full column-by-column detail, including exact types, defaults, and indexes: `../DATABASE_SCHEMA.md`.
