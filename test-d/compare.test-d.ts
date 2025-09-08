import { expectType, expectError, expectAssignable, expectNotAssignable } from 'tsd';
import { compare, type ComparisonResult, type CompareOptionsBase } from '..';

// ---------- helpers ----------
type Person = { first: string; last: string; born: Date };
const p1: Person = { first: 'Ana', last: 'Ångström', born: new Date('1990-01-01') };
const p2: Person = { first: 'Zed', last: 'Álvares', born: new Date('1985-05-05') };

// ---------- return type must be -1 | 0 | 1 ----------
expectType<ComparisonResult>(compare(1, 2));
expectType<ComparisonResult>(compare('a', 'b'));
expectType<ComparisonResult>(compare(new Date(), new Date()));
expectType<ComparisonResult>(compare(1n, 2n));

// ---------- Supported primitives: options optional ----------
expectType<ComparisonResult>(compare(1, 2)); // OK
expectType<ComparisonResult>(compare('a', 'b', { order: 'desc' })); // OK

// ---------- collator: instance or options ----------
expectType<ComparisonResult>(compare('a10', 'a2', { collator: { numeric: true } }));
expectType<ComparisonResult>(compare('a', 'b', { collator: new Intl.Collator('en') }));

// ---------- mixedKind policy only specific values ----------
expectType<ComparisonResult>(compare('a' as string | number, 1 as string | number, { mixedKind: 'rank' }));
expectType<ComparisonResult>(compare('a' as string | number, 1 as string | number, { mixedKind: 'numeric' }));
expectType<ComparisonResult>(compare('a' as string | number, 1 as string | number, { mixedKind: 'string' }));
expectError(compare('a' as string | number, 1 as string | number, { mixedKind: 'whatever' })); // ❌

// ---------- Custom type: comparisonFunc REQUIRED ----------
expectError(compare<Person>(p1, p2)); // ❌

// valid comparator returns ComparisonResult
const personCmp = (a: Person, b: Person): ComparisonResult => compare(a.last, b.last, { collator: { sensitivity: 'base' } }) || compare(a.first, b.first, { collator: { sensitivity: 'base' } });

expectType<ComparisonResult>(compare<Person>(p1, p2, { comparisonFunc: personCmp }));


// But if you normalize to -1|0|1, it’s OK:
expectType<ComparisonResult>(compare<Person>(p1, p2, {
  comparisonFunc(a, b) {
    const diff = a.first.length - b.first.length;
    return diff < 0 ? -1 : (diff > 0 ? 1 : 0);
  }
}));

// ---------- order / nulls properties exist on options ----------
type PersonOptions = CompareOptionsBase<Person>;
expectAssignable<PersonOptions>({ order: 'asc', nullsPriority: 'first', comparisonFunc: personCmp });
expectNotAssignable<PersonOptions>({ order: 'ascending', comparisonFunc: personCmp }); // ❌

// ---------- BigInt typing ----------
expectType<ComparisonResult>(compare(10n, 2n));
expectError(compare(10n as any, 2)); // mixing bigint and number at type level should be avoided
