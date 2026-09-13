# Security Policy

## Supported versions

This repository contains the official mi-pase SDKs. Security fixes are
applied to the latest published version of each package. Please make sure
you are on the most recent release before reporting an issue.

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub
issues, discussions, or pull requests.**

Instead, please report it privately through GitHub's
[Security Advisories](https://github.com/mi-pase/sdk/security/advisories/new)
("Report a vulnerability").

Please include as much of the following as you can:

- The affected package and version (e.g. `@mi-pase/sdk` x.y.z).
- A description of the vulnerability and its impact.
- Steps to reproduce, a proof of concept, or affected source location.
- Any suggested remediation, if known.

## What to expect

- We aim to acknowledge your report within **3 business days**.
- We will keep you informed of progress toward a fix and full disclosure.
- Please give us a reasonable window to release a fix before any public
  disclosure. We are happy to credit reporters unless you prefer to remain
  anonymous.

## Scope

This policy covers the code in this repository. It does **not** cover the
mi-pase platform/API itself — for issues in the backend service, please use
the private reporting channel above and note that it concerns the backend.

## Handling credentials

The SDKs authenticate with a Clerk Organization API key sent as a bearer
token. Never commit API keys, tokens, or other secrets to this repository.
If you believe a credential has been exposed, rotate it immediately and
notify us using the channels above.
