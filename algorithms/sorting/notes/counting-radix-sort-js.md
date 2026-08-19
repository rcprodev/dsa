# Counting Sort and Radix Sort — JavaScript

## Breaking the O(n log n) floor

Every sort in the previous two guides is comparison-based — it decides order by asking "is A bigger than B?" There's a proven lower bound of O(n log n) for any algorithm that sorts this way (it falls out of the number of possible orderings and how much information one comparison can extract). Counting sort and radix sort get around that bound by never comparing elements to each other at all — they use the *values themselves* as indices. That's the one idea to lead with if asked "how can this be faster than O(n log n)?": it isn't beating the comparison lower bound, it's sidestepping the comparison model entirely.

The trade-off for that speed: both only work on non-negative integers (or things that map cleanly to them, like fixed-length strings), and both have costs tied to the size of the value range, not just the array length.

## Counting sort

Count how many times each value appears, then use those counts to place every element directly into its final sorted position — no comparisons anywhere.

```javascript
function countingSort(arr, maxVal) {
  const count = new Array(maxVal + 1).fill(0);
  const output = new Array(arr.length);

  // 1. count occurrences of each value
  for (const num of arr) count[num]++;

  // 2. transform counts into cumulative counts —
  //    count[v] now means "how many elements are <= v"
  for (let i = 1; i <= maxVal; i++) count[i] += count[i - 1];

  // 3. place elements from the back, using cumulative count as the target index
  //    iterating backward is what makes this stable
  for (let i = arr.length - 1; i >= 0; i--) {
    const val = arr[i];
    output[count[val] - 1] = val;
    count[val]--;
  }

  return output;
}
```
The diagram above shows step 1 in isolation — raw counts per value before the cumulative-sum transform. Step 2 is the part that's easy to gloss over but does the real work: turning "how many 3s are there" into "how many elements are ≤ 3," which is exactly the final index (minus one) that the last 3 in the array should land on.

**Why iterate backward in step 3:** processing the original array back-to-front and decrementing the count after each placement means two equal elements get placed in the same relative order they started in — that's what makes counting sort stable. Iterating forward instead still produces a correctly *sorted* array, just not a stable one; worth being able to state that distinction if asked.

**Complexity:** O(n + k) time and O(n + k) space, where `k` is the range of values (`maxVal + 1`). That `k` term is the catch — counting sort is excellent when the value range is small and known (grades 0–100, ages 0–120, single digits), and a bad idea when the range is huge relative to n (sorting 10 numbers that happen to include one value of 10 million means allocating a 10-million-length count array for 10 elements).

## Radix sort

Counting sort's range problem is exactly what radix sort solves: instead of counting sort over the *whole value*, run counting sort repeatedly over each *digit*, from least significant to most significant. Each pass only needs a count array of size 10 (for base-10 digits), regardless of how large the numbers themselves are.

```javascript
function radixSort(arr) {
  if (arr.length === 0) return arr;
  const maxVal = Math.max(...arr);

  for (let exp = 1; Math.floor(maxVal / exp) > 0; exp *= 10) {
    countingSortByDigit(arr, exp);
  }
  return arr;
}

function countingSortByDigit(arr, exp) {
  const n = arr.length;
  const output = new Array(n);
  const count = new Array(10).fill(0); // digits are always 0-9

  for (let i = 0; i < n; i++) {
    const digit = Math.floor(arr[i] / exp) % 10;
    count[digit]++;
  }

  for (let i = 1; i < 10; i++) count[i] += count[i - 1];

  for (let i = n - 1; i >= 0; i--) {
    const digit = Math.floor(arr[i] / exp) % 10;
    output[count[digit] - 1] = arr[i];
    count[digit]--;
  }

  for (let i = 0; i < n; i++) arr[i] = output[i];
}
```
`exp` walks through `1, 10, 100, 1000, ...` — `Math.floor(arr[i] / exp) % 10` pulls out the ones digit, then tens digit, then hundreds digit, on successive passes. The loop stops once `exp` exceeds the largest number, meaning every digit position has been processed.

**Why it has to be LSD (least significant digit first), and why each pass must be stable:** this is the single most important thing to understand about radix sort, not just memorize. Sorting by the ones digit first, then tens, then hundreds only produces a correct final order because each pass is stable — when two numbers tie on the digit currently being sorted, the *previous* pass's ordering (which already reflected the lower-order digits) is preserved. Break stability in any single pass and the whole algorithm produces garbage, because higher-order digit passes would then discard correctly-ordered lower digits. That's exactly why radix sort's subroutine has to be counting sort specifically — it's one of the few O(n) sorts that's stable by construction.

**Complexity:** O(d × (n + k)) where `d` is the number of digits in the largest number and `k` is the base (10 for decimal, so `k` is a constant). For fixed-width numbers (32-bit integers, say), `d` is a constant too, which is why radix sort is often described as O(n) in practice — genuinely linear for fixed-size integer keys, something no comparison sort can claim.

## Handling negative numbers

Neither algorithm handles negatives natively, since both use values as array indices. The standard fix for counting sort: shift every value by the minimum (`count[val - minVal]++`) so the range starts at 0. For radix sort: separate negatives and positives into two arrays, radix-sort the absolute values of the negatives, reverse that sublist, negate back, and concatenate negatives-then-positives. It's not conceptually hard, just fiddly — worth naming as a known adaptation rather than treating "these don't handle negatives" as a dead end.

## Where these show up beyond raw sorting

The value-as-index trick isn't limited to full sorts — it's the same idea behind bucket-based frequency problems generally. Any time a problem's values are bounded and small (character frequencies, digit sums, scores capped at 100), reach for a counting array before reaching for a `Map` or a comparison sort; it's simpler and faster when the bound holds. Radix sort's digit-by-digit LSD strategy also generalizes directly to sorting fixed-length strings — treat each character position as a "digit" over a 26- or 256-symbol alphabet instead of base 10.

## Comparison with the O(n log n) sorts

| | Counting sort | Radix sort | Merge/heap sort |
|---|---|---|---|
| Time | O(n + k) | O(d(n + k)) | O(n log n) |
| Works on | non-negative ints, small range | non-negative ints (or fixed-width keys) | any comparable type |
| Stable | yes | yes (if digit passes are stable) | merge sort yes, heap sort no |
| Space | O(n + k) | O(n + k) | O(n) merge, O(1) heap |

The deciding question is always "what are the keys, and how big is their range" — if the answer is "arbitrary comparable objects," these two aren't in play at all; they only win when the input is integers (or integer-like) with a bound you can exploit.

## Pitfalls that actually cost points

- **Forward iteration in the placement step.** Breaks stability silently — the array still ends up sorted, so this bug won't show up unless the interviewer specifically asks about stability or tests with tagged duplicate values.
- **Using counting sort when the range is unbounded or huge.** `count = new Array(maxVal + 1)` on a single large outlier value allocates a huge array for no benefit — the O(n + k) claim only pays off when k is small relative to n.
- **Non-stable digit passes in radix sort.** Using anything other than counting sort (or another stable sort) as the per-digit subroutine breaks the entire algorithm's correctness, not just its stability.
- **Off-by-one in the cumulative sum.** `count[val] - 1` (not `count[val]`) is the correct target index, since cumulative count is a 1-indexed "how many so far," and array indices are 0-indexed.
- **Forgetting the loop termination condition in radix sort.** `Math.floor(maxVal / exp) > 0` — using a fixed number of passes instead of deriving it from the actual max value either does wasted passes or, worse, stops too early on larger inputs.

## Practice checklist

- Sort an Array — LC 912 (can be solved with counting sort if the value range is stated as bounded, worth mentioning as an alternative to comparison sorts)
- Sort Colors — LC 75 (a counting sort with exactly 3 buckets — the smallest possible instance of the idea)
- Maximum Gap — LC 164 (the classic "why would you ever need O(n) sorting" problem — requires linear-time sorting to hit the required overall complexity, and radix or bucket sort is the intended tool)
- Relative Sort Array — LC 1122 (counting sort adapted to a custom, given order instead of numeric order)
- H-Index — LC 274 (bounded value range makes counting sort a clean fit)
