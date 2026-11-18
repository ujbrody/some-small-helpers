# some-small-helpers repository guidance

- This is Uri's reusable TypeScript npm library. Verify the current branch, remote and existing changes before starting work. Preserve unrelated changes.
- Read `package.json`, `eslint.config.mjs`, the affected implementation and its tests. Public exports live in `src/index.ts` and `src/types/index.ts`. Functions and colocated Jest tests live in `src/functions/`. Type-contract tests live in `test-d/`.
- Preserve existing public behavior, defaults, exported types and supported inputs unless Uri approves a breaking change. Check other callers and tests before changing a shared helper. Treat changes to output labels and classification precedence as API changes.
- Keep helpers independent of consuming applications. Use synthetic examples for consumer-specific regressions. Coordinate downstream adoption as a separate change in the consumer repository.
- Follow the existing ESLint and TypeScript conventions. Run ESLint on changed TypeScript files and fix their errors. Keep formatting and cleanup scoped to the task.
- Available checks are `npm test -- --runInBand --silent`, `npm run build`, and `npm run tsd`. The last command rebuilds and runs type-contract tests. For a focused test, use `npm test -- --runInBand --runTestsByPath src/functions/<name>.spec.ts`.
- Edit source files and let the build generate `dist/`. The package publishes `dist/`, with CommonJS JavaScript and TypeScript declarations. Check emitted exports/types when changing the public API. Verify the actual package contents when preparing a release.
- Source comments contain most function documentation. Check examples and comments against observed behavior when changing a function.
- Report existing failures separately from new regressions. On 2026-11-17 at `c722dfe`, Node 26.13.0 passed 17 Jest suites / 349 tests and the build. `npm run tsd` failed at `test-d/compare.test-d.ts:53` with "Expected an error, but found none." Recheck this baseline as needed.
- Uri retains consequential API, versioning, commit, merge and npm publication decisions unless explicitly authorized for the task. Repository ownership alone does not authorize a package release.
