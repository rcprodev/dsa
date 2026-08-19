# Bubble Sort, Insertion Sort, Selection Sort — JavaScript

## Why these still matter despite being O(n²)

None of these beat `Array.prototype.sort()` or an O(n log n) algorithm for real workloads. They come up in interviews for a different reason: they're the cleanest place to demonstrate you understand *in-place* mutation, *stability*, and the difference between "comparing" and "moving" elements — vocabulary that later shows up when discussing merge sort, quicksort, or why a language's built-in sort behaves the way it does. Knowing which of these three is stable, which does the fewest writes, and which adapts well to nearly-sorted input is usually worth more than the code itself.

| | Time (worst) | Time (best) | Space | Stable | Writes |
|---|---|---|---|---|---|
| Bubble sort | O(n²) | O(n) with early-exit | O(1) | yes | many (swaps) |
| Insertion sort | O(n²) | O(n) | O(1) | yes | few, shifts not swaps |
| Selection sort | O(n²) | O(n²) | O(1) | no (naive version) | O(n) — fewest of the three |

**Stable** means equal elements keep their original relative order. Matters when sorting by one key but wanting to preserve an earlier sort on another key (e.g. sort by score, but ties should stay in the order they were entered).

## Bubble sort

Repeatedly walk the array comparing adjacent pairs, swapping when they're out of order. Each full pass "bubbles" the largest unsorted element to its correct position at the end.

```javascript
function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    // after each pass, the last i elements are already in place
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    if (!swapped) break; // early exit — array is already sorted
  }
  return arr;
}
```
The `swapped` flag is the detail worth including without being asked — without it, bubble sort runs the full O(n²) even on an already-sorted array. With it, best case drops to O(n) since a single clean pass with no swaps ends the whole thing. That's usually the first follow-up question in an interview: "how would you optimize this?"

## Selection sort

Instead of swapping adjacent out-of-order pairs, scan the *entire* unsorted remainder each pass to find the minimum, then swap it into place. One swap per pass, guaranteed — that's its only real advantage.

```javascript
function selectionSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
  }
  return arr;
}
```
Exactly n−1 swaps total, regardless of input — compare that to bubble sort, which can do up to O(n²) swaps on reversed input. That makes selection sort worth mentioning specifically when *write cost* is expensive relative to *comparison cost* (e.g. sorting data on flash memory, where writes wear the medium but reads are cheap).

The trade-off: it never adapts to partially-sorted input. Best case and worst case are both O(n²), because it always scans the full unsorted remainder to find the minimum even if the array is already sorted.

**Why the naive version isn't stable:** swapping `arr[i]` with `arr[minIdx]` can jump an element over several equal elements between them, changing their relative order. Example: `[3, 1, 3a]` (marking the second 3 to track it) — selecting the minimum and swapping can leave `3a` before the first `3`. A stable version exists (shift instead of swap) but costs the O(1)-swap advantage that's the whole point of using selection sort in the first place.

## Insertion sort

Build up a sorted prefix one element at a time — take the next unsorted element and shift it backward through the sorted prefix until it lands in the right spot. This is the algorithm most people already run by hand when sorting a hand of playing cards.

```javascript
function insertionSort(arr) {
  const n = arr.length;
  for (let i = 1; i < n; i++) {
    const curr = arr[i];
    let j = i - 1;
    // shift everything larger than curr one position right
    while (j >= 0 && arr[j] > curr) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = curr;
  }
  return arr;
}
```
Two things make this the one worth defaulting to among the three when the interview allows picking: it's the only one that's genuinely fast — O(n) — on nearly-sorted input (each element shifts only a short distance), and it does shifts instead of full swaps, which is cheaper when swapping means moving large records rather than primitives. It's also the algorithm real-world hybrid sorts (Timsort, introsort) fall back to for small subarrays, because O(n²) with a tiny constant factor beats O(n log n) with a larger one once n is small enough.

## Choosing between them in an interview

If asked "implement a sort" with no further constraint, insertion sort is the strongest default of these three to reach for — it's stable, adapts to nearly-sorted data, and the shift-based approach demonstrates slightly more sophistication than a plain swap loop. Bubble sort is worth knowing for the early-exit optimization question specifically. Selection sort is worth knowing for the "minimize writes" framing — it's rarely the right general-purpose answer, but it directly demonstrates you understand the write-vs-comparison cost trade-off, which comes up again when discussing external sorting or sorting on write-limited storage.

## Pitfalls that actually cost points

- **Forgetting the early-exit flag in bubble sort.** Without it, an interviewer who asks "what's the best case?" gets an O(n²) answer that should be O(n).
- **Using swap instead of shift in insertion sort.** A naive swap-based version still works but does 3x the writes of the shift-based version and loses the "adapts well to nearly-sorted data" property's clean explanation.
- **Off-by-one on the inner loop bound in bubble sort.** `n - 1 - i` (not `n - 1`) is what actually skips the already-bubbled suffix each pass — using a fixed bound just makes redundant comparisons, not incorrect ones, but it's the detail that signals whether you understand *why* the bound shrinks.
- **Assuming selection sort is stable.** It isn't in its standard swap-based form — worth stating explicitly if a problem depends on stability.
- **Reaching for one of these on large, real-world data.** These are teaching/demonstration algorithms. If a problem is actually about sorting performance at scale, the expected answer is `Array.prototype.sort()`, merge sort, or quicksort — using bubble sort there is itself a red flag in an interview, not a neutral choice.

## Practice checklist

These three are usually building blocks rather than standalone LeetCode problems, so the practice value is in applying them inside a slightly bigger question — but a few problems test the underlying mechanics directly:

- Sort Colors — LC 75 (Dutch national flag; a single-pass variant of the selection-sort idea)
- Insertion Sort List — LC 147 (same shifting logic, but on a linked list instead of an array)
- Merge Sorted Array — LC 88 (tests understanding of in-place merging, a natural next step after these three)
