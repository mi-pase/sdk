<p align="center">
  <img src="./assets/logo.svg" height="60px" alt="Mi Pase" />
</p>

<h1 align="center">Mi Pase SDKs</h1>

<p align="center">Official SDKs for the <a href="https://mi-pase.ar">Mi Pase</a> API — manage projects, enrollments, rewards, pass templates, and validators from your own backend.</p>

## Available SDKs

| Language | Package | Docs |
| --- | --- | --- |
| Node.js / TypeScript | [`@mi-pase/sdk`](packages/node) | [Usage guide](packages/node/README.md) |

More languages are on the way.

## Quick start (Node.js)

```bash
npm install @mi-pase/sdk
```

> `@mi-pase/sdk` is published to GitHub Packages rather than the public npm registry — see the [Node SDK docs](packages/node/README.md#installation) for the one-time `.npmrc` setup this requires.

```ts
import { MiPaseClient } from "@mi-pase/sdk";

const client = new MiPaseClient({
  // A Clerk Organization API key from your Mi Pase organization's settings.
  apiKey: process.env.MI_PASE_API_KEY!,
});

const project = await client.projects.create({
  domain: "acme",
  name: "Summer Fest 2026",
});

await client
  .project(project._id)
  .enrollments.create({ domain: "acme", name: "Jane Doe", email: "jane@example.com" });
```

See the [Node SDK README](packages/node/README.md) for the full API reference — projects, enrollments, rewards, templates, validators, and error handling.

## Support

Questions or issues? Open an [issue](https://github.com/mi-pase/sdk/issues) on this repo.

---

## Contributing

<details>
<summary>Local development, testing, and releasing</summary>

This is a monorepo — one directory per language SDK under `packages/`. See [CLAUDE.md](CLAUDE.md) for the conventions a new package should follow.

```bash
npm install                  # installs all workspaces
npm run build                 # builds all packages
npm test                      # unit tests for all packages (no credentials required)
```

Scoped to one package:

```bash
npm run build -w packages/node
npm test -w packages/node
```

### Integration tests

`packages/node` also has a live integration suite that exercises every SDK method against a real Mi Pase deployment. It's skipped automatically unless `MI_PASE_TEST_API_KEY` is set, so it never runs against real infrastructure by accident:

```bash
MI_PASE_TEST_API_KEY=... \
MI_PASE_TEST_DOMAIN=ci-testing \
MI_PASE_TEST_BASE_URL=https://staging.app.mi-pase.ar \
npm run test:integration -w packages/node
```

The test org's API key must belong to the org whose slug is `MI_PASE_TEST_DOMAIN` — every create call in the suite asserts domain access using that org. In CI this runs from the `MI_PASE_TEST_API_KEY` GitHub Actions secret, gated in front of every publish (see below).

### Releasing

Every push to `main` that passes CI:

1. Runs the Node SDK's unit **and** integration test suites.
2. Auto-bumps `packages/node/package.json`'s patch version and commits it back to `main` (message tagged `[skip ci]` so it doesn't trigger another publish).
3. Publishes `@mi-pase/sdk` to GitHub Packages.

There's no manual version bump step — just merge to `main`. If you need a minor/major bump instead of a patch, bump `packages/node/package.json` yourself in your PR; the auto-bump only applies when the version wasn't already changed.

See [`.github/workflows/publish.yml`](.github/workflows/publish.yml).

</details>
