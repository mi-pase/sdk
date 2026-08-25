# mi-pase SDKs

Official SDKs for the [mi-pase](https://mi-pase.ar) API. This is a monorepo — one directory per language, all published from the same repo.

| Package | Language | Path | Registry |
| --- | --- | --- | --- |
| [`@mi-pase/sdk`](packages/node) | Node.js / TypeScript | `packages/node` | GitHub Packages (`@mi-pase` scope) |

More languages will get their own `packages/<language>` directory as they're added — see [CLAUDE.md](CLAUDE.md) for the conventions a new package should follow.

For usage docs, install instructions, and the full API reference, see the [Node SDK's README](packages/node/README.md).

## Development

```bash
npm install                 # installs all workspaces
npm run build                # builds all packages
npm test                     # unit tests for all packages (no credentials required)
```

Scoped to one package:

```bash
npm run build -w packages/node
npm test -w packages/node
```

### Integration tests

`packages/node` also has a live integration suite that exercises every SDK method against a real mi-pase deployment. It's skipped automatically unless `MI_PASE_TEST_API_KEY` is set, so it never runs against real infrastructure by accident:

```bash
MI_PASE_TEST_API_KEY=... \
MI_PASE_TEST_DOMAIN=ci-testing \
MI_PASE_TEST_BASE_URL=https://staging.app.mi-pase.ar \
npm run test:integration -w packages/node
```

The test org's API key must belong to the org whose slug is `MI_PASE_TEST_DOMAIN` — every create call in the suite asserts domain access using that org. In CI this runs from the `MI_PASE_TEST_API_KEY` GitHub Actions secret, gated in front of every publish (see below).

## Releasing

Every push to `main` that passes CI:

1. Runs the Node SDK's unit **and** integration test suites.
2. Auto-bumps `packages/node/package.json`'s patch version and commits it back to `main` (message tagged `[skip ci]` so it doesn't trigger another publish).
3. Publishes `@mi-pase/sdk` to GitHub Packages.

There's no manual version bump step — just merge to `main`. If you need a minor/major bump instead of a patch, bump `packages/node/package.json` yourself in your PR; the auto-bump only applies when the version wasn't already changed.

See [`.github/workflows/publish.yml`](.github/workflows/publish.yml).
