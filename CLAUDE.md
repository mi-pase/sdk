# CLAUDE.md

Guidance for working in this repo — a monorepo of official mi-pase SDKs, one directory per language under `packages/`.

## What this is

The mi-pase platform (backend: `mi-pase/diamond`, a NestJS app) exposes a public API surface behind Swagger at `/api-docs/public`, restricted to the modules customers actually call: **Projects, Enrollments, Rewards, Templates, Validators, Health**. Everything in `packages/*` is a thin, ergonomic client over that surface, authenticated with a **Clerk Organization API key** sent as `Authorization: Bearer <key>`.

If you need to check exact request/response shapes, the source of truth is the `diamond` repo, not memory — read the controllers and DTOs directly:

```
diamond/src/backend/src/modules/{projects,enrollments,rewards,templates,validators,health}/*.controller.ts
diamond/src/backend/src/modules/{projects,enrollments,rewards,templates,validators}/dto/*.ts
diamond/src/backend/src/modules/{projects,enrollments,rewards,templates,validators}/*.schema.ts
```

`diamond/src/backend/src/main.ts` defines which modules are actually in the public Swagger doc — if that `include: [...]` list changes, the SDK's resource surface should change with it.

## Repo layout

```
packages/
  node/                    # @mi-pase/sdk — Node.js / TypeScript
    src/
      client.ts            # MiPaseClient — top-level entrypoint
      http.ts               # fetch wrapper: auth header, timeout, retry, error parsing
      errors.ts             # MiPaseApiError / MiPaseTimeoutError / MiPaseNetworkError
      v1/
        types/              # one file per entity (Project, Enrollment, Reward, Template, Validator, ...)
        resources/           # one class per resource, mirrors the API's URL structure
    test/                    # vitest unit tests (mocked fetch, no network)
    test/integration/        # live tests against a real deployment, env-gated
```

## API versioning

The mi-pase API is `v1` only today (no version prefix in its URLs). The SDK still organizes code under `src/v1/` and gates `MiPaseClient`'s `apiVersion` option to `"v1"`, so that when `v2` endpoints ship on the backend:

1. Add `src/v2/types` and `src/v2/resources` mirroring the `v1` layout for whatever changed.
2. Extend `ApiVersion` to `"v1" | "v2"` in `client.ts`.
3. Decide the exposure shape then (e.g. `client.v2.project(...)` alongside the default `v1` surface, or a `apiVersion` constructor option that switches the whole client) — don't guess this ahead of time, the right shape depends on what actually changes in v2.

## Resource design conventions

The SDK favors a **fluent, chainable** style over flat method names — this is a deliberate ergonomic choice, not incidental:

```ts
client.project(id).get()
client.project(id).enrollment(id).setCustomFields({...}, { override: true })
client.project(id).rewards.create({...})
```

When adding a new resource or method:

- A resource that's addressable by id gets a singleton class (`ProjectResource`, `EnrollmentResource`, ...) constructed via `client.project(id)` / `client.enrollment(id)` etc., **not** just `client.projects.get(id)`.
- A resource nested in the real API's URL (e.g. rewards under `/api/projects/:projectId/rewards`) gets its own class taking the parent id in its constructor, exposed as a property on the parent singleton (`ProjectResource.rewards`).
- Where the real API's update semantics are a full-replace but that's awkward for callers (see `EnrollmentResource.setCustomFields`), it's fine for the SDK to add a client-side convenience (fetch-then-merge) as long as there's an escape hatch (`{ override: true }`) to hit the raw API behavior without an extra round trip.
- Every resource method needs a `/** ... */` comment naming the exact HTTP verb + path it calls — that's how you audit the SDK against the backend later without re-reading every controller.
- Delete methods are named `delete()`, not `remove()`.

## Error handling

`HttpClient` (`src/http.ts`) is the only place that talks to `fetch`. All resource methods go through it. It:

- Sends `Authorization: Bearer <apiKey>` and a `User-Agent` on every request.
- Retries GET/PUT/DELETE (not POST, unless a caller passes `{ idempotent: true }`) on network errors, timeouts, and 429/502/503/504, with jittered exponential backoff.
- Throws `MiPaseApiError` for any non-2xx response, `MiPaseNetworkError` for transport failures, `MiPaseTimeoutError` for client-side timeouts.

Don't add per-resource error handling — if the API's error shape changes, fix it once in `http.ts`.

## Testing

- **Unit tests** (`test/*.test.ts`) mock `fetch` (see `test/mock-fetch.ts`) — no network, no credentials, always run in CI on every PR.
- **Integration tests** (`test/integration/*.test.ts`) hit a real deployment and are skipped unless `MI_PASE_TEST_API_KEY` is set. They create and clean up real records (projects, templates, etc.) scoped to the `MI_PASE_TEST_DOMAIN` org — never point them at a production org's real data. In CI they run from the `MI_PASE_TEST_API_KEY` / `MI_PASE_TEST_DOMAIN` / `MI_PASE_TEST_BASE_URL` secrets/vars, gated in front of every publish.
- When adding a new resource method, add both a unit test (mocked) and an integration test (real call + cleanup in the shared `afterAll`).

## Releasing

`packages/node` publishes to **GitHub Packages** (`@mi-pase` scope), not the public npm registry — see the root README for why. `.github/workflows/publish.yml` runs on every push to `main`: CI checks → integration tests → auto-bump the patch version (only if it wasn't already bumped in the triggering commit) → `npm publish`. There is no manual release step; don't hand-bump the version unless you deliberately want a minor/major bump instead of the automatic patch.

## Adding a new language SDK

Create `packages/<language>/` following that language's own idiomatic conventions (this isn't a codegen-from-OpenAPI setup — each SDK is hand-written to match the target language's ergonomics) but keep the cross-cutting decisions consistent with `packages/node`:

- Same auth model: constructor/init takes a Clerk Organization API key, sent as `Authorization: Bearer <key>`.
- Same resource surface: Projects, Enrollments, Rewards, Templates, Validators, Health — matching whatever `diamond`'s public Swagger doc includes at the time.
- Same versioning posture: structure for `v1` today, leave an explicit seam for `v2` later.
- Its own CI workflow and its own publish workflow, targeting that language's package registry, gated behind that package's own test suite the same way `publish.yml` gates on integration tests today.
