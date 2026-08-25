# @mi-pase/sdk

Official Node.js / TypeScript SDK for the [mi-pase](https://mi-pase.ar) API — manage projects, enrollments, rewards, pass templates, and validators from your backend.

- Zero runtime dependencies, built on the native `fetch`.
- Full TypeScript types for every request and response.
- A fluent, chainable API: `client.project(id).enrollment(id).setCustomFields(...)`.
- Ships ESM and CJS builds.

## Installation

This package is published to **GitHub Packages**, not the public npm registry. Add this to your project's `.npmrc`:

```
@mi-pase:registry=https://npm.pkg.github.com/
```

Then authenticate npm with a GitHub personal access token that has `read:packages` scope (ask your mi-pase contact if you don't have one), either via `npm login --scope=@mi-pase --registry=https://npm.pkg.github.com` or by adding to `.npmrc`:

```
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Then install as usual:

```bash
npm install @mi-pase/sdk
```

## Quick start

```ts
import { MiPaseClient } from "@mi-pase/sdk";

const client = new MiPaseClient({
  // A Clerk Organization API key, created from your mi-pase organization's
  // API Keys settings panel. Sent as `Authorization: Bearer <apiKey>`.
  apiKey: process.env.MI_PASE_API_KEY!,
});

const project = await client.projects.create({
  domain: "acme",
  name: "Summer Fest 2026",
});

const enrollment = await client.project(project._id).enrollments.create({
  domain: "acme",
  name: "Jane Doe",
  email: "jane@example.com",
});

// Chain from a project straight into one of its enrollments:
await client
  .project(project._id)
  .enrollment(enrollment._id)
  .setCustomFields({ seat: "12A" }, { override: true });
```

## Client options

```ts
new MiPaseClient({
  apiKey: "...",           // required — Clerk Organization API key
  baseUrl: "...",          // default: "https://app.mi-pase.ar"
  timeoutMs: 30_000,       // per-request timeout
  maxRetries: 2,           // retries for GET/PUT/DELETE on network/timeout/429/5xx errors
  fetch: customFetch,      // override the fetch implementation
});
```

POST requests are never retried automatically (they're not idempotent by default — e.g. creating a project twice would create two projects). Pass `{ idempotent: true }` as a per-call option where the underlying resource method exposes it if you know a specific POST is safe to retry.

## API versioning

The mi-pase API is currently `v1` only; every method shown below talks to `v1` endpoints. The client accepts a reserved `apiVersion` option (`"v1"` today) so that when `v2` endpoints ship, this SDK can add a `v2` surface without a breaking change to the `v1` one.

## Resources

### Projects

```ts
await client.projects.list({ domain, kind });
await client.projects.create({ domain, name, ... });

await client.project(id).get();
await client.project(id).update({ name: "New name" });
await client.project(id).delete();      // only finalized projects can be deleted
await client.project(id).duplicate();
```

### Enrollments

```ts
await client.enrollments.list({ project, person, domain });
await client.enrollments.create({ domain, project_id, name, email, phone, customFields });
await client.enrollments.bulkCreate({ domain, project_id, rows: [...] });
await client.enrollments.copyToProject({ sourceProjectId, targetProjectId, domain });

await client.enrollment(id).get();
await client.enrollment(id).update({ customFields });  // full replace, matches the raw API
await client.enrollment(id).delete();
await client.enrollment(id).setCustomFields({ seat: "12A" });                     // merges with existing fields (fetches first)
await client.enrollment(id).setCustomFields({ seat: "12A" }, { override: true }); // full replace, no extra fetch
```

Scoped to a project, `project_id` is filled in for you:

```ts
await client.project(projectId).enrollments.list();
await client.project(projectId).enrollments.create({ domain, name, email });
await client.project(projectId).enrollments.bulkCreate({ domain, rows: [...] });
await client.project(projectId).enrollment(enrollmentId).setCustomFields({...});
```

### Rewards

Rewards only exist within a project — there's no top-level `/rewards` endpoint.

```ts
await client.project(projectId).rewards.list();
await client.project(projectId).rewards.create({ name, description, pointsRequired });
await client.project(projectId).rewards.update(rewardId, { pointsRequired: 200 });
await client.project(projectId).rewards.delete(rewardId);
```

### Templates

```ts
await client.templates.list({ domain });
await client.templates.create({ domain, name, type: "event" });

await client.template(id).get();
await client.template(id).update({ name: "New name" });
await client.template(id).delete();
await client.template(id).duplicate();
await client.template(id).getConfig();              // Apple + Google wallet design, or undefined if unsynced
await client.template(id).saveConfig({ apple, google });
```

### Validators

```ts
await client.validators.list({ domain });
await client.validators.create({ domain, name, project, scanMode: "both" });
await client.validators.recordsForEnrollments([enrollmentId1, enrollmentId2]);

await client.validator(id).get();
await client.validator(id).update({ scanMode: "nfc" });
await client.validator(id).delete();
await client.validator(id).scan({ scannedValue, scanMode: "camera" });
await client.validator(id).records({ limit: 50, skip: 0, search: "" });
```

`scan()` can return `{ matches: [...] }` instead of a validation record when the scanned value resolves to more than one enrollment — use the exported `isScanAmbiguous()` type guard and re-scan with `enrollmentId` set:

```ts
import { isScanAmbiguous } from "@mi-pase/sdk";

const result = await client.validator(id).scan({ scannedValue, scanMode: "camera" });
if (isScanAmbiguous(result)) {
  // prompt the operator to pick one of result.matches
} else {
  // result is a ValidationRecord
}
```

### Health

```ts
await client.health(); // { status: "ok", timestamp: "..." }
```

## Error handling

Every non-2xx response throws `MiPaseApiError`:

```ts
import { MiPaseApiError } from "@mi-pase/sdk";

try {
  await client.project("does-not-exist").get();
} catch (error) {
  if (error instanceof MiPaseApiError) {
    console.error(error.status, error.message, error.body);
  }
  throw error;
}
```

Network failures throw `MiPaseNetworkError`; client-side timeouts throw `MiPaseTimeoutError`.

## Requirements

Node.js 18 or later (for global `fetch`), or pass your own `fetch` implementation via `options.fetch`.
