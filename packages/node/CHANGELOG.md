# Changelog

All notable changes to `@mi-pase/sdk` are documented here. This project follows [Semantic Versioning](https://semver.org/).

## Unreleased

### Added

- `client.enrollment(id).revoke()` — revoke an enrollment's issued pass while keeping the person enrolled, unlike `delete()` which unenrolls them (`POST /api/enrollments/:id/revoke`). Idempotent: a no-op when there is no issued pass, and the pass can be re-issued later. Returns the updated `Enrollment` (its `downloadUrl` is gone once revoked).

## 0.2.0

### Added

- **Notifications resource** (`client.notifications`) — send wallet push notifications to a project's active passes, and inspect past sends.
  - `send({ domain, project, message, appleMessage?, googleMessage?, enrollmentIds?, issuedFrom?, issuedTo? })` — `message` is shared across both wallets, with optional per-platform overrides. `googleMessage` may contain a single `<a href>` anchor that Google Wallet renders as a tappable link (Apple pushes have no link support). Restrict the send with `enrollmentIds` (specific enrollments) and/or an `issuedFrom`/`issuedTo` issued-date window.
  - `list({ domain })` and `listByPasses([...])` — sent-notification history.
  - `preview({ domain, project, enrollmentIds?, issuedFrom?, issuedTo? })` — returns `{ count, cooldownUntil }` without consuming the per-project 24h cooldown.
  - Note: sends are plan-gated and capped at one per project per 24h; a send inside that window throws a `MiPaseApiError` with status `429`.

> Requires the `NotificationsModule` to be present in the backend's public Swagger surface (`/api-docs/public`).
