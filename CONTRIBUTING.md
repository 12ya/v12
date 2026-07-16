# Contributing

Thanks for helping improve V12. Bug fixes, reliability improvements, performance work, documentation, and focused features are welcome.

## Before You Start

- Search existing issues and pull requests first.
- Open an issue before starting a significant feature or architectural change.
- Keep pull requests focused on one problem.
- Report security vulnerabilities privately according to [SECURITY.md](./SECURITY.md).

Small fixes can be submitted directly when the problem and solution are clear.

## Development Setup

Install [Vite+](https://viteplus.dev/guide/), then install dependencies:

```bash
vp i
```

Before submitting a change, run:

```bash
vp check
vp run typecheck
```

For native mobile changes, also run:

```bash
vp run lint:mobile
```

Use `vp test` for the built-in Vite+ test command. Use `vp run test` when you specifically need the repository's `test` package script.

## Pull Requests

- Explain the problem, the solution, and any important tradeoffs.
- Include tests for behavior changes when practical.
- Include before-and-after images for visual changes.
- Include a short recording for motion or interaction changes.
- Avoid unrelated refactors, generated files, and dependency churn.
- Confirm that no secrets, private data, or machine-specific files are included.

Maintainers may ask for changes or decline work that does not fit the project's direction. Reviews will stay focused on the contribution and its technical merits.

## Community

Participation in this project is governed by our [Code of Conduct](./CODE_OF_CONDUCT.md).
