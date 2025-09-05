export type ComparisonResult = -1 | 0 | 1;

export interface CompareOptionsBase<T> {
  order?: 'asc' | 'desc';
  nullsPriority?: 'first' | 'last'; // Should nulls/undefined be first in comparison or last
  mixedKind?: 'rank' | 'numeric' | 'string'; // How to handle mixed types in comparison?
  collator?: Intl.Collator | (Intl.CollatorOptions & { locale?: string | string[] });
  comparisonFunc?: (a: T, b: T) => number; // A custom function to compare two items
}


type Supported =
  | number
  | bigint
  | string
  | Date
  | boolean
  | null
  | undefined;

export type CompareOptionsForSupported<T extends Supported> = CompareOptionsBase<T>;

export type CompareOptionsForCustom<T> = CompareOptionsBase<T> & Required<Pick<CompareOptionsBase<T>, 'comparisonFunc'>>;
// If the type of one of the two items is not supported, consumer of the function must provide a custom comparison function


// Narrow kind for consistent branching
function kindOf(val: Supported):
  | 'number'
  | 'bigint'
  | 'string'
  | 'date'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'unknown' {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val instanceof Date) return 'date';
  if (typeof val === 'number') return 'number';
  if (typeof val === 'bigint') return 'bigint';
  if (typeof val === 'string') return 'string';
  if (typeof val === 'boolean') return 'boolean';
  return 'unknown'; // unreachable safeguard
}

const defaultCollator = new Intl.Collator(undefined, {
  sensitivity: 'base',
  numeric: false,
  caseFirst: 'false'
});

function resolveCollator(option?: CompareOptionsBase<any>['collator']): Intl.Collator {
  if (!option) return defaultCollator;

  if (option instanceof Intl.Collator) return option;

  const { locale, ...restOfOptions } = option;

  return new Intl.Collator(locale, restOfOptions);
}


// ---- Overloading the function ----

// Built-in primitives support
export function compare<T extends Supported>(a: T, b: T, options?: CompareOptionsForSupported<T>): ComparisonResult;

// Custom types support (comparisonFunc is required!)
export function compare<T>(a: T, b: T, options: CompareOptionsForCustom<T>): ComparisonResult;


// ---- Implementation ----
export function compare<T>(a: T, b: T, options?: CompareOptionsBase<T>): ComparisonResult {

  const {
    order = 'asc',
    nullsPriority = 'last',
    mixedKind = 'rank',
    comparisonFunc
  } = options || {};
  const factor = order === 'asc' ? 1 : -1;


  // If user supplies a custom comparison function it always wins immediately
  if (comparisonFunc) return Math.sign(comparisonFunc(a, b)) * factor as ComparisonResult;


  // From this point on, we're assuming that both items are primitives
  const aSupported = a as Supported;
  const bSupported = b as Supported;

  const aKind = kindOf(aSupported);
  const bKind = kindOf(bSupported);


  // Null/Undefined policy
  if (aKind === 'null' || aKind === 'undefined' || bKind === 'null' || bKind === 'undefined' || aKind === 'unknown' || bKind === 'unknown') {

    const aIsNullish = aKind === 'null' || aKind === 'undefined';
    const bIsNullish = bKind === 'null' || bKind === 'undefined';

    if (aIsNullish && bIsNullish) return 0;

    if (aIsNullish) {
      return ((nullsPriority === 'first' ? -1 : 1) * factor) as ComparisonResult;
    }

    return ((nullsPriority === 'first' ? 1 : -1) * factor) as ComparisonResult;
  }


  // Handling mixed types
  if (aKind !== bKind) {
    if (mixedKind === 'numeric') {
      // Attempted numeric subtraction
      // NaN guarded to keep sort stable
      const n1 = Number(a as any);
      const n2 = Number(b as any);

      if (Number.isNaN(n1) && Number.isNaN(n2)) return 0;
      if (Number.isNaN(n1)) return 1 * factor as ComparisonResult;
      if (Number.isNaN(n2)) return -1 * factor as ComparisonResult;

      return Math.sign(n1 - n2) * factor as ComparisonResult;
    }

    if (mixedKind === 'string') {
      const s1 = String(a as any);
      const s2 = String(b as any);

      return resolveCollator(options?.collator).compare(s1, s2) * factor as ComparisonResult;
    }

    // Default: deterministic rank to avoid surprises
    const kindRank: Record<ReturnType<typeof kindOf>, number> = {
      boolean: 0,
      number: 1,
      bigint: 2,
      date: 3,
      string: 4,
      null: -1,
      undefined: -2,
      unknown: -3,
    };
    return Math.sign(kindRank[aKind] - kindRank[bKind]) * factor as ComparisonResult;
  }


  // From this point, both items are of the same supported type
  switch (aKind) {
    case 'number': {
      const n1 = a as number;
      const n2 = b as number;

      if (Number.isNaN(n1) && Number.isNaN(n2)) return 0;
      if (Number.isNaN(n1)) return 1 * factor as ComparisonResult;
      if (Number.isNaN(n2)) return -1 * factor as ComparisonResult;

      return Math.sign(n1 - n2) * factor as ComparisonResult;
    }

    case 'bigint': {
      const x = a as bigint;
      const y = b as bigint;

      if (x === y) return 0;

      return (x < y ? -1 : 1) * factor as ComparisonResult;
    }

    case 'boolean': {
      const n1 = a ? 1 : 0;
      const n2 = b ? 1 : 0;

      return Math.sign(n1 - n2) * factor as ComparisonResult;
    }

    case 'date': {
      const d1 = (a as Date).getTime();
      const d2 = (b as Date).getTime();

      if (Number.isNaN(d1) && Number.isNaN(d2)) return 0;
      if (Number.isNaN(d1)) return 1 * factor as ComparisonResult;
      if (Number.isNaN(d2)) return -1 * factor as ComparisonResult;

      return Math.sign(d1 - d2) * factor as ComparisonResult;
    }

    case 'string': {
      const s1 = String(a as any);
      const s2 = String(b as any);

      return resolveCollator(options?.collator).compare(s1, s2) * factor as ComparisonResult;
    }

    default: { return 0 as ComparisonResult; } // Technically unreachable, but we need to satisfy the type checker
  }
}
