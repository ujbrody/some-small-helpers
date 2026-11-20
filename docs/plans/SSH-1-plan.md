---
type: implementation-plan
workflow_id: engineering.delivery
workflow_version: ""
status: implemented
plan_version: "9"
owner: primary_implementer
authoritative_parent: "Linear SSH-1, with scope departures listed under Plan authority (pending Uri's approval)"
created_at: "2026-11-18"
updated_at: "2026-11-19"
---

# Implementation Plan: SSH-1, `ignoreCustomClassNames`, `discoverTypes`, `nullIsEmpty`, wildcard comparison and cycle protection for `determineArrayType`

## Instance contract

- **Instance type:** Durable project execution plan and handoff artifact.
- **Destination:** `docs/plans/SSH-1-plan.md` in this repository, as Uri specified on 2026-11-18.
- **Maintainer:** Primary Implementer.
- **Human visibility:** Uri approves a specific plan revision, the remaining ambiguities, and any release or versioning choice.
- **Retention/closure:** Keep with the repository history after completion. Mark superseded if replaced.

## Plan dashboard

**Current position:** 🟩 Complete (all steps)  
**Progress:** `8 of 8 steps complete`  
**Next action:** `Uri reviews the change; then decide on commit, independent review, versioning and the Linear update`  
**Awaiting:** `Nothing`  
**Blocker:** `None`

| Status | Step | Current result/evidence |
|---|---|---|
| 🟩 Complete | 1. Baseline check | 2026-11-19 at `c3695a0`: 17/349 tests pass, build passes, `tsd` fails only at the known `compare.test-d.ts:53` |
| 🟩 Complete | 2. Option types | Three optional fields added. ESLint clean, build passes, emitted `.d.ts` shows them, 349 tests pass. |
| 🟩 Complete | 3. Recursion context and cycle protection | Wrapper, internal function and level body split. `'<circular>'` at both traversal points. 349 tests pass. 12/12 scratch cycle checks match the plan. |
| 🟩 Complete | 4. Built-in identification helper | Private `identifyBuiltIn` added. 349 tests pass. 61/61 scratch checks. DataView uses the `buffer` getter (see evidence). |
| 🟩 Complete | 5. `ignoreCustomClassNames` classification | Option active. 349 tests pass. 45/45 scratch option checks. Earlier scratch checks still pass. |
| 🟩 Complete | 6. Discovery and the unified level comparison | Unified algorithm and discovery in place. 349 tests pass. 92/92 + 6/6 scratch checks. Earlier checks still pass. |
| 🟩 Complete | 7. Runtime tests | 117 new tests; 466/466 pass. Found and fixed a realm bug in the brand-check catch (see evidence). |
| 🟩 Complete | 8. Docs, lint, build and type check | JSDoc rewritten; 35/35 doc claims verified. Lint, 466 tests, build, `tsd` (known failure only) and typecheck all as expected. |

**Status legend:** ⬜ Not started · 🟦 Ready · 🟨 In progress · 🟥 Blocked/decision needed · 🟩 Complete · ⏸️ Paused/deferred · ⛔ Cancelled

## TL;DR

`determineArrayType` gets one comparison rule for every array level:

1. Every cell gets a label. A matching predicate supplies it; otherwise the cell is classified fully, recursing into inner arrays.
2. Wildcards are removed. These are `undefined` cells always, and `null` cells when the new `nullIsEmpty` option is set. In an array of arrays, an inner array whose own result is `'[empty]'` or `'[undefined]'` is also a wildcard, as is `'[null]'` when `nullIsEmpty` is set. These array wildcards are removed only when another real array at the level isn't one.
3. If the remaining labels are identical, the result is that label. Otherwise it is `'mix'`, or `'[mix]'` when every remaining cell is an unlabelled non-empty array.

The arrays-of-arrays shortcut is removed. The plain-object key check stays, as deferred.

Three new options and one protection come with this:

- **`ignoreCustomClassNames`:** plain and custom objects give `'object'`. A bounded set of built-ins keeps its labels, recognised by real identity.
- **`discoverTypes`:** caller predicates. The first match wins, and discovery applies at any depth.
- **`nullIsEmpty`** (default `false`): when set, `null` cells become wildcards like `undefined`.
- **Cycle protection** in every mode, using the `'<circular>'` marker.

Precedence: `discoverTypes`, then `identifyClasses`, then automatic classification. Errors from user code propagate unchanged.

Several default-mode outputs change (see Compatibility), so a major version is suggested.

## Plan authority

- **Approval:** Once Uri approves a specific plan revision, that revision governs implementation scope and acceptance. Material later changes need renewed approval. This doesn't override repository instructions or action permissions.
- **Linear:** SSH-1's description is narrower than this plan. Once Uri explicitly approves the departures below, correcting SSH-1 stops blocking implementation. After approval, the recommendation is to link this plan from SSH-1, or summarise it there. That Linear write is not made now and needs its own authorization.

### Departures from the original SSH-1 description (for Uri's review)

| # | SSH-1 says | This plan | Source |
|---|---|---|---|
| 1 | Option named `ignoreClassName` | Renamed to `ignoreCustomClassNames`. No alias, because it was never released. | Uri, 2026-11-19 |
| 2 | Skip only the constructor clause in the plain-object gate. Don't infer broader suppression. | Custom and plain objects collapse to `'object'`. Supported built-ins keep their labels. Subclasses report the built-in's label. | Uri, 2026-11-19 |
| 3 | Precedence, multiple matches and predicate exceptions deferred | P2 precedence, first match wins, errors propagate unchanged | Uri, 2026-11-19 |
| 4 | Predicates receive "the array item". Recursive scope deferred. | Discovery and every option apply through all recursion, including property values that get visited | Uri, 2026-11-19 (D1) |
| 5 | Shortcuts must not bypass discovery | One unified level comparison of final labels, with wildcards. The arrays-of-arrays shortcut is removed. | Uri, 2026-11-19 (D2, P1, A2, A3) |
| 6 | (not mentioned) | Cycle protection in every mode, with the `'<circular>'` marker | Uri, 2026-11-19 (P2, P3) |
| 7 | (not mentioned) | `undefined` cells are wildcards in default mode, and a new `nullIsEmpty` option makes `null` cells wildcards too | Uri, 2026-11-19 |
| 8 | (not mentioned) | Default-mode output changes: see Compatibility | Follows from #5–#7 |
| 9 | (not mentioned) | Two stale JSDoc statements corrected (`mixed` → `mix`, and the wrong example) | AGENTS.md doc-accuracy rule |
| 10 | (not mentioned) | Comparing every object's properties exhaustively is deferred and recorded here. No new issue is created. | Uri, 2026-11-19 |

## Outcome and boundaries

- **Intended outcome:**
  - Every level reports the most accurate common label of its meaningful cells.
  - Absent values (`undefined`, and optionally `null`) and empty arrays don't spoil that label.
  - Callers can collapse custom objects while still seeing real built-in types, and can name types with predicates at any depth.
  - Cyclic input no longer overflows the stack.
- **Acceptance criteria:**
  - **Level comparison:** every level follows the unified algorithm below. No shortcut drops a cell's label, except for the deferred plain-object key check.
  - **Wildcards:**
    - An unlabelled `undefined` cell, or an unlabelled `null` cell when `nullIsEmpty: true`, is a wildcard whenever the level has at least one non-wildcard cell.
    - **Array wildcards:** an unlabelled real array whose own result is `'empty'`, `'undefined'`, or `'null'` when `nullIsEmpty` is set. In the parent these appear as `'[empty]'`, `'[undefined]'` and `'[null]'`. An array wildcard is a wildcard only among arrays: it's removed only when the level also has a real array that isn't a wildcard, and that array may be predicate-labelled.
    - In other words, if a value is a wildcard, an array holding only that value is a wildcard among arrays. `'[empty]'` is an additional array wildcard.
    - A cell that a predicate labels is never a wildcard. A predicate-labelled empty array doesn't let other arrays be removed (A1).
    - Array identity is tracked separately from labels. A non-array whose predicate label happens to be `'[empty]'` is not an array wildcard.
    - An empty array is an array, so it never makes its parent `'empty'`.
  - **`'[mix]'` and `'mix'`:** `'[mix]'` only when every remaining cell is an unlabelled real non-empty array and their labels differ. Any other disagreement gives `'mix'`.
  - **`nullIsEmpty`:** defaults to `false`. When `false`, `null` is a type, so `[1, null]` gives `'mix'`.
  - **`ignoreCustomClassNames`:** as accepted in v4 and v5. With it omitted or `false`, automatic classification and constructor-name behavior are unchanged, and no new detection runs.
  - **Precedence:** `discoverTypes` (first matching entry wins, and no more predicates run for that value), then `identifyClasses` (first match in the list), then automatic classification.
  - **Recursion:**
    - All options carry through every recursive classification.
    - Objects collapsed to `'object'` are not expanded.
    - `verboseObjects` still controls property expansion.
    - Wildcards apply to array cells only. Object property types are reported as they are, so `{ a: undefined }` stays `'{ a: undefined }'`.
  - **Errors:**
    - Errors from predicates, getters, Proxy traps and other user code propagate unchanged.
    - Only expected intrinsic brand-check `TypeError`s are caught, and only around calls that can't run user code.
  - **Cycles:** `'<circular>'` in every mode, tracked along the active path only. Opaque objects are never expanded to look for cycles. Stack-overflow errors are never caught.
  - **Coverage:** runtime tests, TypeScript option definitions and JSDoc cover all of the above.
- **Required examples:**

| Input | Options | Output |
|---|---|---|
| `[new A(), new B()]` | `ignoreCustomClassNames` | `'object'` |
| `[{ a: 1 }, { b: 2 }]` | `ignoreCustomClassNames` | `'object'` |
| `[new Date(), new Date()]` | `ignoreCustomClassNames` | `'Date'` |
| `[new Map(), new Map()]` | `ignoreCustomClassNames` | `'Map'` |
| `[new Date(), new Map()]` | `ignoreCustomClassNames` | `'mix'` |
| `[/abc/, /xyz/]` | `ignoreCustomClassNames` | `'RegExp'` |
| `[[1, 2], [], [3]]` | — | `'[number]'` |
| `[[], ['a'], []]` | — | `'[string]'` |
| `[[1], [], ['a']]` | — | `'[mix]'` |
| `[[], []]` | — | `'[empty]'` |
| `[1, undefined, 2]` | — | `'number'` |
| `[undefined, undefined]` | — | `'undefined'` |
| `[1, null]` | — | `'mix'` |
| `[1, null]` | `nullIsEmpty` | `'number'` |
| `[null, undefined]` | — | `'null'` |
| `[null, undefined]` | `nullIsEmpty` | `'empty'` (nested: `'[empty]'`) |
| `[null, null]` | either | `'null'` (A5) |
| `[[], undefined]` | — | `'[empty]'` (A6) |
| `[[1], [undefined]]` | — | `'[number]'` (A7; today: `'[mix]'`) |
| `[[1], [null]]` | — | `'[mix]'` |
| `[[1], [null]]` | `nullIsEmpty` | `'[number]'` |
| `[{ a: 1 }, { b: 2 }, undefined]` | — | `'mixed object'` |
| `[{ a: 1 }, undefined]` | — | `'{ a: number }'` |
| `[[1], 'a']` | — | `'mix'` (today: `'[number]'`) |

- **Constraints:**
  - Under `AGENTS.md`, labels and precedence count as public API.
  - The public signature `determineArrayType(arr, options)` stays the same; the internal recursion context is not exported.
  - The built-in helper stays bounded.
- **Non-goals:**
  - A depth-limit API.
  - A cycle-reporting API.
  - Exhaustive comparison of object properties.
  - Temporal, Intl, `WeakRef` and `FinalizationRegistry` support.
  - Changing default-mode built-in detection.
  - Wildcards inside object properties.
  - Consumer adoption, a version bump or an npm release.
- **Task risk/project profile:** `T2`. It changes default-mode output for existing inputs and rewrites the core level comparison. Explicit plan review and an independent code review are needed.

## Accepted decisions

| Decision | Accepted direction | Authority |
|---|---|---|
| Option name | `ignoreCustomClassNames`, with no `ignoreClassName` alias | Uri, 2026-11-19 |
| Option behavior | Custom and plain objects give `'object'`. Built-ins keep labels. Default mode is unchanged by this option. | Uri, 2026-11-19 |
| Subclasses | Applicable built-in label: `MyDate` → `'Date'`, `AppError` → `'Error'`, `BadInput extends TypeError` → `'TypeError'` | Uri, 2026-11-19 |
| Precedence (D5) | P2: `discoverTypes`, then `identifyClasses`, then automatic | Uri, 2026-11-19 |
| Multiple matches and errors (D3) | First match wins. User-code errors propagate unchanged. Brand-check catches stay narrow. | Uri, 2026-11-19 |
| Recursion scope (D1) | All options through all recursion that actually happens | Uri, 2026-11-19 |
| Shortcuts (D2) and A3 | No shortcut may drop a cell's label. The arrays-of-arrays shortcut is removed, so every cell is classified fully and compared. | Uri, 2026-11-19 |
| P1 | An empty array is a wildcard among compatible arrays. It is never a wildcard for non-arrays. A predicate-labelled empty array keeps its label. | Uri, 2026-11-19 |
| A1 | Only a real non-empty array enables empty-array wildcards. A labelled empty array does not. | Uri, 2026-11-19 |
| A2 | The result comes from comparing every cell's final label. One cell with a different label, a predicate label included, gives a mix. | Uri, 2026-11-19 |
| `'[mix]'` | Kept only when every remaining cell is an unlabelled real non-empty array and their labels differ. Otherwise `'mix'`. | Uri, 2026-11-19 |
| `undefined` wildcard | Always on, in default mode. A default-mode behavior change. | Uri, 2026-11-19 |
| `nullIsEmpty` | New option, default `false`. When `true`, `null` acts like `undefined`. | Uri, 2026-11-19 |
| All-wildcard levels | Only `undefined` cells → `'undefined'`. `null` and `undefined` mixed, with `nullIsEmpty: false` → `'null'`. `null` and `undefined` mixed (or no cells), with `nullIsEmpty: true` → `'empty'`. | Uri, 2026-11-19 |
| A5 | A level of only `null` cells always gives `'null'` (`'[null]'` when nested), whatever `nullIsEmpty` is | Uri, 2026-11-19 |
| A6 | An empty array is an array and never makes its parent `'empty'`. `[[], undefined]` → `'[empty]'`. | Uri, 2026-11-19 |
| A7 | In an array of arrays, `'[empty]'` and `'[undefined]'` are always wildcards, and `'[null]'` is a wildcard when `nullIsEmpty` is set. With `nullIsEmpty: false`, `'[null]'` makes the result a mix (`'[mix]'`) when another array has a different type. | Uri, 2026-11-19 |
| A8 | With `nullIsEmpty: true`, a level whose cells are all array wildcards with different labels gives `'[empty]'`. For example, `[[undefined], [null], []]` → `'[empty]'` (`'[[empty]]'` when nested), and `[[], [undefined]]` → `'[empty]'`. Identical array wildcards keep their label: `[[undefined], [undefined]]` → `'[undefined]'`, and `[[null], [null]]` → `'[null]'` (A5). With `nullIsEmpty: false`, `null` is a value and never results in `'empty'`; see A9. | Uri, 2026-11-19 |
| A9 | With `nullIsEmpty: false`, `null` is always a value and never empty. `'[null]'` is then an ordinary array type, like `'[number]'`, and the wildcard arrays give way to it. So `[[undefined], [null], []]` → `'[null]'`, the same as `[[undefined], [1], []]` → `'[number]'`. Similarly, `[[undefined], [null]]` → `'[null]'`, and `[[1], [null]]` → `'[mix]'`. | Uri, 2026-11-19 |
| Wildcards before the object check | Removed before the plain-object key check, but only when at least one other cell is non-empty | Uri, 2026-11-19 |
| P2 and P3 cycles | `'<circular>'` marker in every mode. Active-path tracking. It's a summary, not a report. | Uri, 2026-11-19 |
| P4 built-ins | The table below, including `AggregateError`, `SuppressedError` and `Float16Array` where available | Uri, 2026-11-19 |
| Deferred | Temporal, Intl, `WeakRef`, `FinalizationRegistry`, and exhaustive object comparison | Uri, 2026-11-19 |
| D4 (v1) | Superseded in v2, and stays recorded as superseded | Uri, 2026-11-19 |
| D6 | Doesn't apply | Uri, 2026-11-19 |

## Remaining ambiguities (need Uri's decision)

None. A1–A9 are settled (see Accepted decisions).

## Unified level algorithm

This runs at every array level, for both the top-level array and every inner array reached through recursion.

1. **Guards:** non-array input → `'not an array'`. A level with no cells → `'empty'`. Both are unchanged.
2. **Discovery:** for each cell, find the first matching `discoveredType`. Each predicate runs at most once per cell, and stops at the first match.
3. **Cell facts** (tracked apart from labels):
   - `matched`;
   - `isArray`;
   - `isAbsent`: unmatched `undefined`, or unmatched `null` when `nullIsEmpty`.
   - `isArrayWildcard`: an unmatched real array whose own result is `'empty'` (no cells, or a `null`/`undefined` mix under `nullIsEmpty`), `'undefined'`, or `'null'` when `nullIsEmpty`. The parent sees these as `'[empty]'`, `'[undefined]'` and `'[null]'`. Array cells are classified at this step, because their wildcard status depends on their own result.
4. **Classify cells:**
   - **absent:** as defined in step 3;
   - **array wildcard:** as defined in step 3;
   - **present:** every other cell, including predicate-labelled cells and non-wildcard arrays.
5. **Remove wildcards:**
   - **Some present cells exist:** drop the absent cells. Drop the array wildcards only if some present cell is a real array that isn't a predicate-labelled empty array (A1). Otherwise they stay and are compared, so `[1, []]` → `'mix'`.
   - **No present cells, but array wildcards exist:** drop the absent cells (A6: an empty array never makes its parent `'empty'`). If the array wildcards all have the same label, return it. Otherwise return `'[empty]'` (A8). With `nullIsEmpty: false`, `'[null]'` is never an array wildcard. It is a present cell, so the "some present cells" rule handles it (A9).
   - **Only absent cells:**
     - all `undefined` → `'undefined'`;
     - all `null` → `'null'` (A5, either mode);
     - with `nullIsEmpty: true`, a mix of `null` and `undefined` → `'empty'`.
     - With `nullIsEmpty: false`, `null` is never absent, so the mix case can't arise. There, `[null, undefined]` → `'null'` through the "some present cells" rule.
6. **Plain-object key check (deferred, kept):**
   - **When it applies:** every remaining cell is an unmatched plain object, and `ignoreCustomClassNames` is off.
   - **What it does:** the existing key-set comparison. It returns `'mixed object'`, or the label of the first remaining object.
   - **Only the first object is described**, as today, so getters and predicates run only on that object's properties.
7. **Label comparison:**
   - Each remaining cell's label is its `discoveredType`, or else its full classification. The full classification calls `getDetailedType` with the skip-self flag, so predicates aren't run twice for the same cell.
   - If every label is identical, return it.
   - If they differ, return `'[mix]'` when every remaining cell is an unlabelled real non-empty array, and `'mix'` otherwise.
   - Classification of non-array cells may stop at the first mismatch, as the generic path does today. Predicates have already run for every cell in step 2, and array cells were classified in step 3.
- **Discovery inside values:** discovery runs at the start of `getDetailedType`, so it also applies to visited property values and nested cells.
- **Sparse arrays:** iteration reads holes as `undefined`, so holes are absent cells.
- **Predicate examples** (`const coords = [1, 2]; const point = { predicate: (v: unknown) => v === coords, discoveredType: 'Point' }`, and `const blank: unknown[] = []; const blankEntry = { predicate: (v: unknown) => v === blank, discoveredType: 'Blank' }`):

| Input | `discoverTypes` | Output | Why |
|---|---|---|---|
| `[coords, [], coords]` | `[point]` | `'Point'` | `[]` is a wildcard, because a real non-empty array is present |
| `[coords, [], [3]]` | `[point]` | `'mix'` | `'Point'` vs `'[number]'`. Not every cell is unlabelled, so it isn't `'[mix]'`. |
| `[[1], ['a'], coords]` | `[point]` | `'mix'` | A2 |
| `[[1], blank]` | `[blankEntry]` | `'mix'` | A labelled empty array isn't a wildcard |
| `[blank, blank]` | `[blankEntry]` | `'Blank'` | |
| `[blank, []]` | `[blankEntry]` | `'mix'` | A1: a labelled empty array doesn't enable wildcards |
| `[[], [], d]`, `d` a Date | Date → `'Stamp'` | `'mix'` | No real non-empty array, so `[]` stays |
| `[s, []]`, `s` a Set | Set → `'[number]'` | `'mix'` | `s` isn't an actual array |
| `[s, [1], []]` | Set → `'[number]'` | `'[number]'` | `[1]` enables the wildcard. `'[number]'` = `'[number]'`. |
| `['a', []]` | `'a'` → `'Letter'` | `'mix'` | An empty array isn't a wildcard for non-arrays |
| `[1, undefined]` | `undefined` → `'Missing'` | `'mix'` | A labelled `undefined` isn't a wildcard |

## Built-in identification design (P4, accepted)

Applies only under `ignoreCustomClassNames: true`. Default-mode detection is unchanged.

| Label | Detection | User code run? |
|---|---|---|
| `Date` | `Date.prototype.getTime.call(v)` | No |
| `RegExp` | `RegExp.prototype.source` getter. `RegExp.prototype` itself also passes, which is an accepted edge case. | No |
| `Map`, `Set` | `size` getter of each prototype | No |
| `WeakMap`, `WeakSet` | `X.prototype.has.call(v, {})` | No |
| `ArrayBuffer`, `SharedArrayBuffer` (guarded) | `byteLength` getter of each prototype | No |
| `DataView` | `DataView.prototype.buffer` getter (changed from `byteLength` in Step 4, which throws for detached buffers) | No |
| `Int8Array`, `Uint8Array`, `Uint8ClampedArray`, `Int16Array`, `Uint16Array`, `Int32Array`, `Uint32Array`, `Float32Array`, `Float64Array`, `BigInt64Array`, `BigUint64Array`, `Float16Array` (guarded) | The intrinsic `%TypedArray%.prototype[Symbol.toStringTag]` getter | No |
| `Number`, `String`, `Boolean`, `BigInt`, `Symbol` (boxed) | `X.prototype.valueOf.call(v)` | No |
| `Error`, `EvalError`, `RangeError`, `ReferenceError`, `SyntaxError`, `TypeError`, `URIError`, `AggregateError` (guarded), `SuppressedError` (guarded) | Is it an error? `Error.isError(v)` where available, else `instanceof Error`. Which label? The nearest of these intrinsic prototypes found by walking the prototype chain. | Yes, through Proxy traps. Errors propagate. |
| `Promise` | `instanceof Promise` | Yes, through Proxy traps. Errors propagate. |

- **Check order:** checks that run no user code come first, then the Error family, then `Promise`.
- **Guards:** every check is guarded by an availability test.
- **Narrow catches:** a `try/catch` wraps only an intrinsic call from the "No" rows. It catches only `TypeError` and rethrows anything else. (Since Step 7 this is realm-correct: only the exact error type each check throws, recorded at module load, counts as "not this type".)
- **Fallback:** anything not detected gives `'object'`.
- **Unsupported under the option:**
  - Temporal, Intl, `WeakRef`, `FinalizationRegistry`.
  - Generators and iterators, `arguments`, namespaces.
  - Host types.
  - Third-party classes.
  - Exception: host subclasses of a supported built-in report the base label. `Buffer` gives `'Uint8Array'`, and `DOMException` gives `'Error'`.
- **Limitations:**
  - **Cross-realm values:** brand-checked types are recognised. `Promise` is not. Errors give `'Error'` when `Error.isError` exists, and `'object'` otherwise.
  - **Spoofing:** brand-checked types can't be faked. `Promise`, and Errors without `Error.isError`, can be faked through the prototype chain.
  - **Proxies:** brand checks fail on a Proxy, and trap errors propagate. A revoked Proxy throws at `Array.isArray` in both modes.
  - **TypeScript lib:** `es2020` target, so newer intrinsics are reached through guarded `globalThis` lookups. `tsconfig` stays unchanged.

## Cycle protection design (P2, P3 accepted)

- **Path tracking:**
  - An internal context `{ path: Set<object> }` is created by the public `determineArrayType` and passed through private recursion in every mode.
  - Values are added before traversal and removed in `finally`, which rethrows.
  - No stack-overflow error is caught.
- **Traversal points:**
  - **Arrays:** the private `determineArrayType` adds its array to the path when it starts.
  - **Array recursion:** `getDetailedType`'s array branch checks the path before recursing into a non-empty array. If the array is already on it, the result is `'<circular>'`, with no `[...]` wrapper.
  - **Object expansion:** `getDetailedType` checks after `shouldBeVerbose` and before reading keys. If the object is already on the path, the result is `'<circular>'`; otherwise the object is added while it's expanded.
  - Values that aren't traversed are never checked.
- **The marker is a summary, not a report:** `'<circular>'` is a traversal marker, not a type name. Comparison can fold it into `'mix'` or `'[mix]'`. A label literally equal to `'<circular>'` would collide with it; this is documented.

| Case | Input | Output |
|---|---|---|
| Self-referencing array | `const a: unknown[] = []; a.push(a); determineArrayType(a)` | `'<circular>'` (today: `RangeError`) |
| Self-referencing expanded object | `const o: Record<string, unknown> = { n: 1 }; o.self = o;` `determineArrayType([o], { verboseObjects: 'all' })` | `'{ n: number, self: <circular> }'` (today: `RangeError`) |
| Same, default `verboseObjects` | `determineArrayType([o])` | `'{ n: number, self: object }'` (unchanged) |
| Indirect cycle, entered through the array | `const arr: unknown[] = []; const holder = { arr }; arr.push(holder); determineArrayType(arr)` | `'{ arr: <circular> }'` (today: `RangeError`) |
| Indirect cycle, entered through a wrapper | `determineArrayType([holder])` | `'{ arr: [<circular>] }'` |
| Shared object without a cycle | `const shared = { v: 1 }; const pair = { a: shared, b: shared };` `determineArrayType([pair], { verboseObjects: 'all' })` | `'{ a: { v: number }, b: { v: number } }'` |
| Shared array without a cycle | `const row = [1]; determineArrayType([row, row])`, and `determineArrayType([[row], [row]])` | `'[number]'` and `'[[number]]'` |
| Discovery stops traversal | `const child: Record<string, unknown> = {}; const root = { child }; child.root = root;` `determineArrayType([root], { verboseObjects: 'all' })` | `'{ child: { root: <circular> } }'` |
| Same, with `discoverTypes: [{ predicate: v => v === child, discoveredType: 'Child' }]` | | `'{ child: Child }'`. The predicate runs twice. |
| Discovery at the top level | `o` as above, with `discoverTypes: [{ predicate: v => v === o, discoveredType: 'Node' }]`, `verboseObjects: 'all'` | `'Node'`. The predicate runs once. |
| Marker folded into `'[mix]'` | `const b: unknown[] = []; b.push(b, [1]); determineArrayType(b)` | `'[mix]'` (both cells are unlabelled non-empty arrays) |
| Marker folded into `'mix'` | `determineArrayType([o, 1], { verboseObjects: 'all' })` | `'mix'` |
| Opaque under the option | `class N { self = this }` `determineArrayType([new N()], { ignoreCustomClassNames: true })` | `'object'` |

## Repository findings and affected boundaries

- **Files:**
  - `src/functions/determineArrayType.ts` holds the options interface, `getDetailedType`, the shortcuts and the JSDoc.
  - `src/functions/determineArrayType.spec.ts` holds the tests.
  - Nothing in `test-d/` or the README covers this function.
  - The Jest environment is Node; the baseline runtime is Node 26.13.0.
- **Current level logic (L200–278):**
  1. The arrays-of-arrays shortcut (L215–237). It skips empty arrays, ignores non-array cells, and returns `'[mix]'` early.
  2. The plain-object shortcut (L240–265).
  3. The generic first-mismatch comparison (L269–277).
  - The new algorithm replaces step 1 and absorbs steps 2 and 3.
- **Existing tests:**
  - None depend on the behaviors that change. `[undefined, undefined]` → `'undefined'`, `[{}, []]` → `'mix'`, `[true, 123, null]` → `'mix'`, and the empty-array leniency tests all still hold.
  - Confirm this in Step 1, and stop if any existing test fails.
- **Cycles today:** nothing guards against them; cyclic input recurses until `RangeError`.
- **Interfaces:** `DetermineArrayTypeOptions` is local and not exported, and appears in the emitted `.d.ts`. The only in-repo use is the re-export at `src/index.ts:31`.
- **Dependencies:** none new. `tsconfig` stays unchanged.

## Concurrency assessment

- **Screen checkpoint:** `Planning/decomposition` (rechecked for v6)
- **Overall disposition:** `Serial — no useful parallel boundary`
- **Net-value rationale:** The new level algorithm is the center of everything else: discovery, wildcards, cycles and the option all meet in it. Only the built-in helper could be separated, and it is small.
- **Human/integration capacity constraint:** Uri's approval is the bottleneck.
- **Pre-dispatch recheck owner:** Primary Implementer.

| Package or step | Boundary/deliverable | Dependencies/shared contract | Class | Proposed owner/environment | Integration order/evidence |
|---|---|---|---|---|---|
| Steps 1–8 | `determineArrayType.ts` and its spec | The options interface, the recursion context, the level algorithm, labels and precedence | Exclusive/high-conflict (single file) | Primary Implementer, local working copy or a feature branch | Sequential. Full suite, build and `tsd` at the end. |

> A serial disposition is a valid result but requires a concise reason. Candidate parallelism does not itself authorize dispatch, additional agents, spending or permission changes.

## Execution steps

- [x] 🟩 **Step 1 — Baseline check**
  - **Change/boundary:** None. Run `npm test -- --runInBand --silent`, `npm run build` and `npm run tsd` at the starting revision. When this plan was written, `HEAD` was `c3695a0`.
  - **Dependencies:** Plan v9 approved.
  - **Verification/test intent:** Compare against the `AGENTS.md` baseline: 17 suites / 349 tests pass, and `tsd` fails at `test-d/compare.test-d.ts:53`. Record anything new separately.
  - **Documentation impact:** None.
  - **Current result/evidence:** 2026-11-19, branch `main` at `c3695a0`, Node 26.13.0. Jest: 17 suites / 349 tests passed. `npm run build`: exit 0. `npm run tsd`: one error, `test-d/compare.test-d.ts:53` "Expected an error, but found none". This is the known pre-existing failure, unrelated to SSH-1. No new failures.

- [x] 🟩 **Step 2 — Option types**
  - **Change/boundary:** Add `ignoreCustomClassNames?: boolean`, `nullIsEmpty?: boolean` and `discoverTypes?: { predicate: (value: unknown) => boolean; discoveredType: string }[]` to `DetermineArrayTypeOptions`. The interface stays unexported.
  - **Dependencies:** Step 1.
  - **Verification/test intent:** The build type-checks. Spec usage compiles under ts-jest.
  - **Documentation impact:** JSDoc is done in Step 8.
  - **Current result/evidence:** 2026-11-19. `ignoreCustomClassNames`, `nullIsEmpty` and `discoverTypes` added to `DetermineArrayTypeOptions` in `src/functions/determineArrayType.ts`. No other code changed. ESLint on the file: clean. `npm run build`: exit 0. `dist/functions/determineArrayType.d.ts` contains all three fields. Jest: 17 suites / 349 tests passed.

- [x] 🟩 **Step 3 — Recursion context and cycle protection**
  - **Change/boundary:**
    - Split the public `determineArrayType` into a wrapper plus a private recursive function that takes the internal context.
    - Pass the context through `getDetailedType`.
    - Add path tracking at the traversal points, with `finally` removal and the `'<circular>'` marker, in every mode.
  - **Dependencies:** Step 2.
  - **Verification/test intent:** Step 7, group G. All existing tests pass unchanged.
  - **Documentation impact:** Document cycles and the marker semantics.
  - **Current result/evidence:** 2026-11-19, in `src/functions/determineArrayType.ts`.
    - **Structure:** the public `determineArrayType` (signature unchanged) creates `{ path: new Set() }` and calls the private `determineArrayTypeInternal`. That function keeps the not-an-array and empty guards, adds the array to `path`, and runs the unchanged level body, now `classifyArrayLevel`, removing the array in `finally`.
    - **Traversal checks:** `getDetailedType` takes the context. It returns `'<circular>'` before recursing into an array already on `path`, and before expanding an object already on `path`; expanded objects are added for the duration of their expansion.
    - **Typing:** `classifyArrayLevel` takes `unknown[]` instead of the implicit `any[]`, so the key comparison casts to `object`, where every item is already confirmed to be a plain object.
    - **Lint and build:** ESLint clean. `npm run build` exits 0. The emitted `.d.ts` exposes only `determineArrayType(arr, options?): string` and no internals.
    - **Tests:** Jest 17 suites / 349 tests pass.
    - **Scratch check:** a throwaway script outside the repo ran the plan's cycle-table cases against `dist/index.js`, and 12/12 matched, including getter-error propagation (the same error object). The permanent tests come in Step 7.

- [x] 🟩 **Step 4 — Built-in identification helper**
  - **Change/boundary:** Add a private `identifyBuiltIn(value: object): string | undefined` that follows the P4 table. Narrow catches only. Guarded availability.
  - **Dependencies:** Step 2.
  - **Verification/test intent:** Step 7, groups B and C.
  - **Documentation impact:** Document the supported set and the limitations.
  - **Current result/evidence:** 2026-11-19, in `src/functions/determineArrayType.ts`.
    - **Helper:** private `identifyBuiltIn`, with its intrinsics captured once at module load and every type guarded for availability.
    - **Brand checks** (each catches only `TypeError` and rethrows anything else): Date `getTime`, RegExp `source`, Map and Set `size`, WeakMap and WeakSet `has`, ArrayBuffer and SharedArrayBuffer `byteLength`, the boxed-primitive `valueOf` methods.
    - **One deviation from the table:** DataView uses the `buffer` getter instead of `byteLength`, because `byteLength` throws for a view over a detached buffer. That would have classified it as not a DataView.
    - **Typed arrays:** the intrinsic `%TypedArray%.prototype[Symbol.toStringTag]` getter, limited to the 12 approved names.
    - **Errors:** `Error.isError` (with an `instanceof Error` fallback), then the nearest standard error prototype, and `'Error'` across realms.
    - **Promise:** `instanceof`.
    - **Lint exception:** a temporary `no-unused-vars` disable on the helper, to be removed in Step 5 when it gets its caller.
    - **Lint, build and tests:** ESLint clean. `npm run build` exits 0, and the `.d.ts` has no internals. Jest 349/349.
    - **Scratch check:** a throwaway script outside the repo transpiled the source in memory and called the private helper. 61/61 matched: every supported type, including the guarded ones (all present in Node 26.13.0); subclasses (`MyDate`, `AppError`, `BadInput`, `MyMap`, `Bytes`, `Buffer` → `'Uint8Array'`, `MyPromise`); a class named `Date`, a spoofed `toStringTag`, a swapped `Date.prototype`, a Proxy around a `Map`, plain and custom objects, and the deferred types (Intl, `WeakRef`, `FinalizationRegistry`, Temporal, `URL`), all → not built-in; a detached `DataView` → `'DataView'`; cross-realm `Map`, `Date`, `TypeError` → `'Error'` and `Promise` → not built-in; a Proxy trap error propagated as the same object.

- [x] 🟩 **Step 5 — `ignoreCustomClassNames` classification**
  - **Change/boundary:** In `getDetailedType`'s object branch, after `identifyClasses` and before the typed-array allowlist and constructor-name checks: when the option is set, return `identifyBuiltIn(value) ?? 'object'`.
  - **Dependencies:** Steps 3 and 4.
  - **Verification/test intent:** Step 7, groups A, D and H.
  - **Documentation impact:** Document the option.
  - **Current result/evidence:** 2026-11-19, in `src/functions/determineArrayType.ts`.
    - **Option branch:** `getDetailedType` returns `identifyBuiltIn(value) ?? 'object'` under the option, after `identifyClasses`.
    - **Key check:** the plain-object key comparison in `classifyArrayLevel` is skipped when the option is set.
    - **Lint exception removed:** the temporary `no-unused-vars` disable from Step 4 is gone.
    - **Lint, build and tests:** ESLint clean. `npm run build` exits 0. Jest 349/349.
    - **Scratch check:** a throwaway script outside the repo ran 45 cases against `dist/index.js`, and 45/45 matched:
      - the six required examples;
      - same-shape and different-shape objects under every `verboseObjects` setting;
      - mixes and nested arrays;
      - subclasses (`MyDate` → `'Date'`, `Buffer` → `'Uint8Array'`), and a class named `Date` → `'object'`;
      - `null`, arrays, functions and primitives unchanged;
      - `identifyClasses` beating the option (P2);
      - a self-referencing class instance → `'object'` (not traversed);
      - default and explicit-`false` regressions.
    - **Earlier checks:** the Step 3 cycle check (12/12) and the Step 4 built-in check (61/61) still pass.
    - Cases that depend on Step 6 (wildcards, discovery, removal of the arrays-of-arrays shortcut) are not covered yet.

- [x] 🟩 **Step 6 — Discovery and the unified level comparison**
  - **Change/boundary:**
    - Replace the level logic in `determineArrayType` with the unified algorithm: discovery, cell facts, wildcard removal (including `nullIsEmpty`), the deferred plain-object key check, and label comparison with the `'[mix]'` rule.
    - Remove the arrays-of-arrays shortcut.
    - Add discovery at the start of `getDetailedType`, with the skip-self flag.
    - Don't catch any predicate errors.
  - **Dependencies:** Steps 3 and 5.
  - **Verification/test intent:** Step 7, groups E, F, G, H and I.
  - **Documentation impact:** Document the level rule, wildcards, `nullIsEmpty`, discovery, precedence and recursion.
  - **Current result/evidence:** 2026-11-19, in `src/functions/determineArrayType.ts`.
    - **Discovery:** `discoverType` (first match, no catch) runs at the start of `getDetailedType` unless `skipDiscovery` is set.
    - **Cell description:** `describeCells` runs discovery once per cell, then classifies array cells, and records `matched`, `isArray`, `isAbsent` and `isArrayWildcard`.
    - **Level comparison:** `classifyArrayLevel` is rewritten to the unified algorithm. It handles the all-wildcard results, wildcard removal (array wildcards give way only to a real array other than a discovered empty one), the plain-object key check on the remaining cells, and the final-label comparison with `'[mix]'` for differing undiscovered arrays. The arrays-of-arrays shortcut is removed.
    - **Implementation clarification (A7):** array wildcards are recognized at any depth by `isWildcardArrayLabel`, so `'[[undefined]]'` is a wildcard too ("if A is a wildcard, [A] is a wildcard"). A first version only handled one bracket level, and the plan's case `[[[undefined]], [[1]]]` → `'[[number]]'` caught it; it's fixed.
    - **Label collision:** a discovered label nested inside an array that is shaped like a wildcard label (for example a predicate returning `'[undefined]'`) is read as one one level up. It's documented like the `'<circular>'` collision.
    - **Lint, build and tests:** ESLint clean. `npm run build` exits 0. Jest 349/349; no existing test changed output.
    - **Scratch checks:** throwaway scripts outside the repo ran against `dist/index.js`. Step 6 cases: 92/92 (every required-example row, every predicate-table row, the A1–A9 cases, sparse arrays, first-match call counts, each cell seen once, recursion D1, error identity, P2 precedence, cycles with discovery and call counts, default regressions). Deeper wildcard cases: 6/6. Earlier scripts still pass: option 45/45, cycles 12/12, built-ins 61/61.

- [x] 🟩 **Step 7 — Runtime tests**
  - **Change/boundary:**
    - Add `describe` blocks in `determineArrayType.spec.ts`. Don't edit existing tests.
    - Each test must fail if its behavior is reverted.
    - Feature-dependent tests use explicit availability guards, so results are deterministic per runtime. Node 26.13.0 runs all of them.
    - Cross-realm values come from `vm.runInNewContext`.
    - Sparse-array tests build their holes with `new Array(n)`, which avoids the `no-sparse-arrays` lint rule.
  - **Group A, `ignoreCustomClassNames` on custom and plain objects:**
    - The six required option examples.
    - Differing keys and all four `verboseObjects` settings give `'object'`.
    - A third-party-style class gives `'object'`.
  - **Group B, built-ins:**
    - A table-driven pair for every P4 type.
    - Mixed pairs give `'mix'`: `[new Uint8Array(), new Int8Array()]`, `[new ArrayBuffer(1), new DataView(new ArrayBuffer(1))]`, `[new TypeError(), new RangeError()]` and `[new Uint8Array(), {}]`.
  - **Group C, subclasses, misleading names, realms, deferred types:**
    - **Subclasses:**
      - `MyDate` → `'Date'`
      - `AppError` → `'Error'`
      - `BadInput extends TypeError` → `'TypeError'`
      - `MyMap` → `'Map'`
      - `Bytes extends Uint8Array` → `'Uint8Array'`
      - `Buffer.from('a')` → `'Uint8Array'`
      - `MyPromise` → `'Promise'`
    - **Misleading names:** a class named `Date`, a spoofed `Symbol.toStringTag`, `Object.setPrototypeOf({}, Date.prototype)` and a Proxy around a `Map` all give `'object'`.
    - **Realms:** a cross-realm `Map` and `Date` keep their labels. A cross-realm `TypeError` gives `'Error'`. A cross-realm `Promise` gives `'object'`.
    - **Deferred types:** Intl, `WeakRef`, `FinalizationRegistry`, Temporal (guarded) and `URL` give `'object'`.
  - **Group D, mixes and nesting under the option:**
    - `[new Date(), new A()]` → `'mix'`
    - `[new A(), { a: 1 }]` → `'object'`
    - `[new A(), undefined]` → `'object'`
    - `[[new Date()], [new A()]]` → `'[mix]'`
    - `[[[new Map()]]]` → `'[[Map]]'`
    - `[[], [new A()]]` → `'[object]'`
    - Non-objects keep their labels.
  - **Group E, discovery:**
    - Every row of the predicate example table.
    - First match wins, with call counts.
    - Final-label comparison: `[new Decimal(1), 2]` with `Decimal` → `'number'` gives `'number'`.
    - **Recursion:**
      - `[[d], [d]]` → `'[Stamp]'`
      - `[{ when: new Date() }]` → `'{ when: Timestamp }'`
      - `[{ list: [d] }]` → `'{ list: [Stamp] }'`
      - Values that aren't visited don't call the predicates.
    - **Errors:** a throwing predicate rethrows the same error object. A throwing getter propagates.
  - **Group F, precedence (P2):**
    - A predicate beats `identifyClasses`, which beats automatic classification.
    - Under the option:
      - `[new Sub()]` with `identifyClasses: [Base]` → `'Base'`
      - `[new A(), {}]` with `identifyClasses: [A]` → `'mix'`
      - `[new MyDate()]` with `identifyClasses: [MyDate]` → `'MyDate'`
    - A throwing `getPrototypeOf` trap propagates.
    - A revoked Proxy throws `TypeError` in both modes.
  - **Group G, cycles:** every row of the cycle table, in default mode and with each new option enabled.
  - **Group H, wildcards and `nullIsEmpty`:**
    - **`undefined` cells:**
      - `[1, undefined, 2]` → `'number'`
      - `[undefined, 1]` → `'number'` (order doesn't matter)
      - `[undefined, undefined]` → `'undefined'`
      - A sparse array `new Array(3)` with `[0] = 1` and `[2] = 2` → `'number'`
    - **`null` cells:**
      - `[1, null]` → `'mix'`, and `'number'` with `nullIsEmpty`
      - `[null, null]` → `'null'` in both modes (A5)
      - `[null, null, 1]` → `'mix'`, and `'number'` with `nullIsEmpty`
      - `[null, undefined]` → `'null'`, and `'empty'` with `nullIsEmpty`
      - `[[null, undefined]]` with `nullIsEmpty` → `'[empty]'`
    - **Objects:**
      - `[{ a: 1 }, undefined]` → `'{ a: number }'`
      - `[{ a: 1 }, { b: 2 }, undefined]` → `'mixed object'`
      - `[{ a: 1 }, null]` → `'mix'`, and `'{ a: number }'` with `nullIsEmpty`
      - `[{ a: undefined }]` → `'{ a: undefined }'` (property types are not wildcards)
    - **Arrays:**
      - `[[1], undefined, []]` → `'[number]'`
      - `[[1, undefined], [2]]` → `'[number]'`
      - `[[], undefined]` → `'[empty]'` (A6)
      - `[[], [], undefined]` → `'[empty]'`
    - **Array wildcards (A7):**
      - `[[1], [undefined, undefined]]` → `'[number]'`
      - `[[1], [], [undefined]]` → `'[number]'`
      - `[[1], [null]]` → `'[mix]'`, and `'[number]'` with `nullIsEmpty`
      - `[[1], [null, null]]` with `nullIsEmpty` → `'[number]'` (the inner result is `'null'` per A5, so it's a wildcard)
      - `[[1], [null, undefined]]` with `nullIsEmpty` → `'[number]'` (the inner result is `'empty'`)
      - `[[undefined], [undefined]]` → `'[undefined]'`
      - `[[null], [null]]` → `'[null]'` in both modes
      - `[[undefined], [null]]` → `'[null]'` (A9), and `'[empty]'` with `nullIsEmpty` (A8)
      - `[[undefined], [null], []]` → `'[null]'` (A9), and `'[empty]'` with `nullIsEmpty` (A8)
      - `[[undefined], [1], []]` → `'[number]'` (the A9 analogy)
      - `[[], [undefined]]` → `'[empty]'` (A8)
      - `[[[undefined], [null], []]]` with `nullIsEmpty` → `'[[empty]]'` (A8, nested)
      - `[[[undefined]], [[1]]]` → `'[[number]]'` (the rule applies again one level deeper)
      - `[[undefined], 1]` → `'mix'` (an array wildcard is never a wildcard for a non-array)
      - `[s, [undefined]]`, with a Set labelled `'[number]'` by a predicate → `'mix'` (`s` isn't a real array)
      - `[coords, [undefined]]` with `[point]` → `'Point'` (a predicate-labelled real array lets the wildcard go)
    - **Arrays mixed with non-arrays (A3):**
      - `[[1], 'a']` → `'mix'`
      - `[[1], [], 'a']` → `'mix'`
      - `[1, []]` → `'mix'`
  - **Group I, default-behavior regressions** (options omitted, and `ignoreCustomClassNames: false`, `nullIsEmpty: false`, same results):
    - The four empty-array examples: `[[1, 2], [], [3]]` → `'[number]'`, `[[], ['a'], []]` → `'[string]'`, `[[1], [], ['a']]` → `'[mix]'`, `[[], []]` → `'[empty]'`.
    - `[[1, 2], ['a', 'b']]` → `'[mix]'`
    - `[new A(), new A()]` → `'A'`
    - Same-key `[new A(), new B()]` → `'mix'`
    - `[{ a: 1 }, { b: 2 }]` → `'mixed object'`
    - `[new MyDate()]` → `'MyDate'`
    - A class named `Date` → `'Date'`
    - `[Buffer.from('a')]` → `'Buffer'`
    - Expansion under `verboseObjects` and `identifyClasses` are unchanged.
    - The plain-object check still describes only the first object.
  - **Dependencies:** Steps 3–6.
  - **Documentation impact:** None.
  - **Current result/evidence:** 2026-11-20, in `src/functions/determineArrayType.spec.ts`.
    - **New tests:** 117 tests appended in new top-level `describe` blocks: ignoreCustomClassNames, discoverTypes, precedence, cycles (run in 4 modes), wildcards and nullIsEmpty, and default behavior preserved (run with the options omitted and explicitly `false`). The existing tests are unedited.
    - **Guards:** feature-dependent tests use `testIf` availability guards. None were skipped on Node 26.13.0.
    - **Realms:** cross-realm values come from `node:vm`.
    - **Results:** focused spec 138/138. Full suite 17 suites / 466 tests. ESLint clean on both files. `npm run build` exits 0. `npm run tsd` shows only the known `compare.test-d.ts:53` failure.
    - **Bug found and fixed (Step 4 helper):**
      - **Cause:** under Jest, some globals (for example `ArrayBuffer`) come from Node's main realm while `TypeError` comes from Jest's sandbox realm. A failing brand check therefore threw the main realm's `TypeError`. The narrow catch (`error instanceof TypeError`) didn't recognize it and rethrew it, so `ignoreCustomClassNames` threw for any value that wasn't an ArrayBuffer. That would affect library consumers testing with Jest. The single-realm scratch scripts didn't catch it.
      - **Fix:** at module load, each brand check runs once on `{}` and records the prototype of the error it throws. Only an error with exactly that prototype counts as "not this type", and anything else is still rethrown. The plan's narrow-catch intent is kept, and the comparison is now realm-correct.
    - **Earlier scripts after the fix:** 92/92, 45/45, 12/12, 61/61 and 6/6.
    - **Note:** under the original implementation, the new spec doesn't compile, because the options don't exist there. So "fails when reverted" is shown per behavior by the scratch checks and by this bug being caught.

- [x] 🟩 **Step 8 — Docs, lint, build and type check**
  - **Change/boundary:**
    - Rewrite the function's JSDoc overview to describe the unified level rule: labels, wildcards (`undefined`, `null` under `nullIsEmpty`, empty arrays among arrays), `'[mix]'` versus `'mix'`, and the all-wildcard results.
    - Add JSDoc for `ignoreCustomClassNames`, `discoverTypes` and `nullIsEmpty`.
    - Add a section on cycles and `'<circular>'`.
    - Add a note to `identifyClasses` that discovery comes before it.
    - Correct the stale `mixed` → `mix` statement and the wrong example.
    - Note the first-object limitation of the object check.
  - **Dependencies:** Step 7.
  - **Verification/test intent:**
    - Run ESLint on the changed files.
    - Run the focused spec, then the full suite.
    - Run `npm run build` and inspect `dist/functions/determineArrayType.d.ts`: the three new options should be present, the internal context and helpers absent, and no `es2021+` types should leak.
    - Run `npm run tsd`. The only failure should be the known baseline one.
  - **Documentation impact:** The JSDoc is the documentation.
  - **Current result/evidence:** 2026-11-20.
    - **JSDoc rewrite** of `determineArrayType` covers:
      - how the type is determined (labels, `'mix'` / `'[mix]'`, the plain-object key check and its first-object limitation);
      - wildcards and the all-wildcard results;
      - circular references (`'<circular>'` as a marker, a summary rather than a report);
      - precedence;
      - each option: `verboseObjects` (wording corrected), `identifyClasses` (first match, precedence), and the new `ignoreCustomClassNames` (supported set, subclasses, detection limits), `nullIsEmpty` and `discoverTypes`.
    - **Stale statements corrected:** three, not two. `mixed` → `mix`; the `[1, 'test', () => {}]` example (`'mix'`, not `'[number, string, function]'`); and the `identifyClasses` example, which claimed `[new BaseClass(), new SubClass()]` → `'SubClass'` when it actually gives `'mix'`.
    - **Examples verified:** a throwaway script checked 35 JSDoc statements and examples against the built output, and all 35 matched.
    - **ESLint:** the changed files and `npm run lint` (the whole of `src`) are clean.
    - **Tests:** Jest 17 suites / 466 tests pass.
    - **Build:** `npm run build` exits 0.
    - **`tsd`:** only the known `compare.test-d.ts:53` failure.
    - **Typecheck:** `npm run typecheck` (new, see below) exits 0.
    - **Emitted declaration:** `dist/functions/determineArrayType.d.ts` exposes only `DetermineArrayTypeOptions`, with the three new optional fields, and `determineArrayType(arr, options?): string`. No internals and no `es2021+` types; those names appear only in JSDoc text. `dist/index.d.ts` still re-exports it, and no spec files are emitted.
    - **Changes outside this plan, found in the working tree:** `package.json` (build → `tsc -p tsconfig.build.json`, new `typecheck` script), `tsconfig.json` (spec files included, `types: ["jest", "node"]`, `noEmit`, `paths` without `baseUrl`), `tsconfig.build.json` (now extends `tsconfig.json`, excludes specs) and a new `.vscode/settings.json` (workspace TypeScript). These were not made by this implementation. They correspond to the editor-types fix discussed on 2026-11-20. The Step 8 checks above ran with them in place.

## Assurance and operations

- **Automated verification and test-quality treatment:**
  - Group I guards default mode.
  - Group H fixes the wildcard rules.
  - Groups B and C guard against name-based detection.
  - Group G fixes the cycle outputs.
  - Call counts guard first-match behavior.
- **Independent review/manual QA:** `T2`. Codex is recommended for a read-only review of the level algorithm, the cycle handling and the brand checks. Claude would be the implementer, so this gives independence. Uri reviews the behavior-change list before release.
- **Security/privacy/authorization:** Not applicable. Use synthetic test data only. No user-code errors are swallowed.
- **Migration/compatibility:**
  - **Intended default-mode output changes:**
    1. **`undefined` cells are wildcards:**
       - `[1, undefined]` → `'number'` (today `'mix'`)
       - `[{ a: 1 }, undefined]` → `'{ a: number }'` (today `'mix'`)
       - `[null, undefined]` → `'null'` (today `'mix'`)
    2. **Arrays-of-arrays shortcut removed:**
       - `[[1], 'a']` → `'mix'` (today `'[number]'`)
       - `[[1], [], 'a']` → `'mix'` (today `'[number]'`)
    3. **Array wildcards (A7):**
       - `[[1], [undefined]]` → `'[number]'` (today `'[mix]'`)
       - `[[1], [undefined, 2]]` → `'[number]'` (today `'[mix]'`, from the `undefined` wildcard inside)
       - `[[], [undefined]]` → `'[empty]'` per A8 (today `'[undefined]'`, because the empty array is skipped)
       - `[[[]], [[1]]]` and `[[[undefined]], [[1]]]` → `'[[number]]'` (today `'[mix]'`; wildcards at any depth)
    4. **Cycles:** cyclic input that recurses until `RangeError` returns a summary containing `'<circular>'`, or a `'mix'` or `'[mix]'` that absorbs it.
  - **Everything else:**
    - For other inputs whose getters, traps and predicates return the same results throughout traversal, outputs are unchanged.
    - Compatibility isn't claimed for stateful user code whose results change during traversal.
    - Very deep acyclic input can still overflow the stack. The overflow is not caught.
  - **Additive changes:** the three options, and `'<circular>'` as a public marker.
  - **Versioning:** the output changes in items 1–3 affect existing callers, so a **major** version is suggested. The version bump, commit, merge and npm release stay with Uri.
  - **Consumers:** any consumer that relies on `'mix'` for arrays containing `undefined`, or on the old arrays-of-arrays result, needs a review in its own repository.
- **Rollback/observation/release:** Revert the single commit. No release is part of this plan.

## Stop and escalation conditions

Stop and go back to Uri if:

- any existing test's output changes;
- an output changes that isn't on the intended-change list;
- a narrow catch can't be kept free of user code;
- widening is needed, such as an exported context or type, a depth limit, cycle reporting, wildcards in object properties, a `tsconfig` change, or default-mode detection changes;
- the baseline differs from the `AGENTS.md` record in a way that hides new regressions;
- implementation would depart from the approved plan revision.

## Deferred work (recorded here; no new issue)

- **Exhaustive object comparison.** The plain-object key check compares key sets across objects but describes only the first object's property types. Comparing every object's property types is deferred.
- **Deferred built-ins:** Temporal, Intl, `WeakRef`, `FinalizationRegistry`.
- **Default-mode typed arrays** are identified by a constructor-name allowlist. That's existing behavior.

## Deviations and amendments

> Preserve accepted intent. Append material changes with date, reason and approval rather than silently rewriting history.

| Date | Deviation/change | Evidence/reason | Approval/status |
|---|---|---|---|
| 2026-11-19 | v2: the option widened to "every non-null, non-array object gives `'object'`". D4 superseded. | Uri's first clarification | Superseded by v3 |
| 2026-11-19 | v3: user-defined class names ignored, built-ins kept (brand-checked), nearest-ancestor subclasses | Uri's second clarification | Superseded by v4 |
| 2026-11-19 | v4: renamed to `ignoreCustomClassNames`. P2 precedence, first match, error propagation, D1 and D2 accepted. Bounded built-ins. Cycle protection. Plan-authority rule. | Uri's third clarification | Decisions accepted; plan superseded |
| 2026-11-19 | v5: P1–P4 settled. Empty-array wildcards. `'<circular>'`. Cycles in every mode. Built-in membership approved. | Uri's fourth clarification | Decisions accepted; plan superseded |
| 2026-11-19 | v6: A1 accepted. A2 and A3 settled into one unified level algorithm: every cell is labelled, wildcards are removed, labels are compared, and the arrays-of-arrays shortcut is removed. `'[mix]'` kept for differing unlabelled real arrays. `undefined` wildcard added in default mode. `nullIsEmpty` option added, with the all-wildcard results. Wildcards removed before the object check when a non-empty cell exists. Length-based `'Pair'` examples replaced by identity-based `'Point'` and `'Blank'`. Risk raised to `T2`, and a major version suggested. A5–A7 raised. | Uri's fifth clarification and AskUserQuestion answers | Decisions accepted; plan superseded by v7 |
| 2026-11-19 | v7: A5 (all-`null` → `'null'` in both modes), A6 (an empty array never makes its parent `'empty'`) and A7 settled. A7 replaces the length-only empty-array wildcard: in an array of arrays, `'[empty]'` and `'[undefined]'` are always wildcards, and `'[null]'` is one under `nullIsEmpty`. A8 (differing array wildcards → `'[empty]'`) derived from these rules, pending confirmation. Tests and compatibility list updated. | Uri's sixth clarification | A5–A7 accepted; plan superseded by v8 |
| 2026-11-19 | v8: A8 settled for `nullIsEmpty: true`: different array wildcards give `'[empty]'`, and identical ones keep their label. The `nullIsEmpty: false` case is raised as A9, because Uri's answer (a mix) conflicts with the A7 wildcard rule and the single-value analogy (`'[null]'`). | Uri's seventh clarification | A8 accepted; plan superseded by v9 |
| 2026-11-19 | v9: A9 settled. With `nullIsEmpty: false`, `null` is always a value, so `'[null]'` is an ordinary array type and wildcard arrays give way to it (`[[undefined], [null], []]` → `'[null]'`). No ambiguities remain. | Uri's eighth clarification | A9 accepted. Uri approved plan v9 for execution on 2026-11-19 ("Let's start executing", then confirmed). |
| 2026-11-19 | Step 4: DataView detection uses the `buffer` getter instead of `byteLength`, because `byteLength` throws for detached buffers | Found during Step 4 verification | Implementation detail within the approved intent |
| 2026-11-19 | Step 6: array wildcards are recognized at any depth (`'[[undefined]]'`), as the plan's own example `[[[undefined]], [[1]]]` → `'[[number]]'` requires | Caught by the Step 6 scratch check | Within the approved A7 rule |
| 2026-11-20 | Step 7: the brand-check catch was made realm-correct (it compares against the error type each check actually throws) instead of using `instanceof TypeError` | Caught by the Jest suite: in mixed-realm environments the old catch rethrew ordinary brand-check failures | Within the approved narrow-catch intent |

## Completion/result

- **Implemented outcome:**
  - `determineArrayType` has the unified level comparison, with wildcards and the arrays-of-arrays shortcut removed.
  - Three new options: `ignoreCustomClassNames`, `nullIsEmpty` and `discoverTypes`.
  - Cycle protection with `'<circular>'` in every mode.
  - The public signature is unchanged. The changes are in `src/functions/determineArrayType.ts` and `src/functions/determineArrayType.spec.ts`.
- **Evidence:** see each step. Final state, 2026-11-20: ESLint clean, Jest 466/466, build passes, `tsd` shows only the pre-existing failure, typecheck passes, and the emitted declaration has been inspected.
- **Documentation:** the function's JSDoc is rewritten and every statement and example in it was verified against the build.
- **Known limitations/residual risk:**
  - **Default-mode output changes** for existing callers (see Compatibility), so a major version is suggested.
  - **Label collisions:** labels that look like `'<circular>'` or like wildcard labels can collide with them.
  - **Detection limits:** cross-realm values and prototype-based detection, as documented.
  - **Deferred work:** exhaustive object comparison; Temporal, Intl, `WeakRef` and `FinalizationRegistry`.
  - **Incidental, pre-existing:** the emitted declaration imports `~types/AnyClass`, a path alias that consumers can't resolve. It has always done this, and SSH-1 doesn't change it. It may be worth a separate issue.
  - **Consumer impact:** the option type accepts only mutable arrays for `discoverTypes` and `identifyClasses`, as before. A caller using `as const` arrays has to copy them.
- **Result packet/review/release links:**
  - **Not committed.**
  - **Independent review:** recommended for `T2`. Codex in read-only review mode, given the diff of the two source files.
  - **Decisions for Uri:** the version bump, the npm release, and linking or summarizing this plan in SSH-1.
- **Superseded scratch checks:** the throwaway scripts in the session scratchpad are not part of the repo.
