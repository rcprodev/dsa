# Linear and Binary Search in Depth — JavaScript

## Linear search

Check every element, in order, until you find a match or run out of array. No preconditions on the data — it works on unsorted input, which is exactly why it's still worth knowing explicitly rather than skipping straight to binary search.

```javascript
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}
```
O(n) time, O(1) space. Reach for it when: the data isn't sorted and sorting it first would cost more than the search saves, the array is small enough that O(n) vs O(log n) doesn't matter in practice, or you need something other than equality (first element matching a predicate, a max/min scan) — binary search only works because sorted data gives you a way to discard half the search space on each comparison, and a plain "find the element matching this condition" doesn't have that property unless the condition itself is monotonic across the array.

**Sentinel variant** — a micro-optimization worth knowing exists, not necessarily worth using in JS: place the target at the end of the array before searching, so the loop never needs a bounds check, only an equality check. In managed languages like JS the bounds check is already fast and the array mutation cost usually erases the benefit, but it's a fair "how would you shave the constant factor" answer if asked.

## Binary search — the core template

Requires sorted (or otherwise monotonic) data. Each comparison eliminates half the remaining search space, which is what gets you from O(n) to O(log n).

```javascript
function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2); // avoids overflow in languages with fixed-width ints
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
```
`lo + Math.floor((hi - lo) / 2)` instead of `Math.floor((lo + hi) / 2)` is a habit worth keeping even though JS numbers don't overflow the way fixed-width integers in Java/C++ do — it's the version that transfers directly if you ever do this in a language that does overflow, and interviewers sometimes ask why the difference matters.

The loop invariant is `lo <= hi` means "there's still a nonempty range to check." Every iteration either returns or shrinks the range — that's the piece to be able to justify if asked to prove termination.

## The seven variants

These aren't seven different algorithms — they're the same halving idea with different exit conditions and different questions being asked of the array.

### 1. Exact match
The template above. Returns the index or -1.

### 2. First occurrence (leftmost / lower bound)
When duplicates exist, don't stop at the first match — keep searching left for an earlier one.
```javascript
function firstOccurrence(arr, target) {
  let lo = 0, hi = arr.length - 1, result = -1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (arr[mid] === target) {
      result = mid;
      hi = mid - 1; // keep looking left for an earlier match
    } else if (arr[mid] < target) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return result;
}
```

### 3. Last occurrence (rightmost / upper bound)
Mirror image — on a match, keep searching right.
```javascript
function lastOccurrence(arr, target) {
  let lo = 0, hi = arr.length - 1, result = -1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (arr[mid] === target) {
      result = mid;
      lo = mid + 1; // keep looking right for a later match
    } else if (arr[mid] < target) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return result;
}
```
First + last occurrence together solve "find the range of a target in a sorted array" (LC 34) directly.

### 4. Search insert position
Where would the target go if it isn't present? This is the "leftmost index where `arr[i] >= target`" question — no separate found/not-found branch needed.
```javascript
function searchInsert(arr, target) {
  let lo = 0, hi = arr.length; // note: hi starts at length, not length - 1
  while (lo < hi) {            // half-open interval [lo, hi)
    const mid = lo + Math.floor((hi - lo) / 2);
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
```
This uses the half-open `[lo, hi)` convention instead of the closed `[lo, hi]` convention from the exact-match template — that's a deliberate, common variant, not an inconsistency. Half-open is usually cleaner for "find a boundary" problems because the loop condition (`lo < hi`) and the final answer (`lo`, which equals `hi`) collapse to the same value with no separate result variable needed. Knowing both conventions, and which one a given problem shape wants, is itself part of what "7 variants" is testing.

### 5. Search in rotated sorted array (LC 33)
The array is sorted but rotated at an unknown pivot. The trick: at every step, at least one half (`lo..mid` or `mid..hi`) is still normally sorted — figure out which one, then check if the target falls in that half's range.
```javascript
function searchRotated(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (arr[mid] === target) return mid;

    if (arr[lo] <= arr[mid]) { // left half is sorted
      if (arr[lo] <= target && target < arr[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else { // right half is sorted
      if (arr[mid] < target && target <= arr[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}
```
The condition `arr[lo] <= arr[mid]` is the whole insight — it tells you which side to trust as a normal sorted range before deciding where to look.

### 6. Find peak element (LC 162)
No target — you're searching for a local maximum using the slope of neighboring elements as the "which half" signal instead of comparison to a value.
```javascript
function findPeakElement(arr) {
  let lo = 0, hi = arr.length - 1;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (arr[mid] > arr[mid + 1]) hi = mid;      // descending — peak is at or left of mid
    else lo = mid + 1;                          // ascending — peak is to the right
  }
  return lo;
}
```
This is the shape that shows binary search doesn't require full-array sortedness — it only requires that *the comparison you're making at each step reliably eliminates half the space*. That's the generalization the next variant pushes even further.

### 7. Binary search on answer — the key conceptual shift
Here's the reframe that trips people up the first time: the array being searched isn't the input data at all — it's the range of *possible answers*, and you binary-search over that range using a feasibility check (`canDo(x)` → true/false) as the comparison. This applies whenever the feasibility function is monotonic (true for all x ≥ some threshold, or false for all x ≥ some threshold).

Classic shape — minimize the maximum, or find the smallest value that satisfies a condition:
```javascript
function minCapacityToShipInDays(weights, days) {
  const canShip = (capacity) => {
    let daysNeeded = 1, currentLoad = 0;
    for (const w of weights) {
      if (currentLoad + w > capacity) {
        daysNeeded++;
        currentLoad = 0;
      }
      currentLoad += w;
    }
    return daysNeeded <= days;
  };

  let lo = Math.max(...weights);       // minimum possible: must fit the heaviest single item
  let hi = weights.reduce((a, b) => a + b, 0); // maximum possible: ship everything in one day

  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (canShip(mid)) hi = mid;        // mid works — try to do better
    else lo = mid + 1;                 // mid doesn't work — need more capacity
  }
  return lo;
}
```
There's no array indexing anywhere in that loop — `lo`/`hi`/`mid` are capacities, not positions. That's the shift: once you recognize a problem as "find the smallest (or largest) value for which some check passes, and the check flips monotonically," it's a binary search even though nothing about the problem statement mentions a sorted array. This shape covers Koko Eating Bananas (LC 875), Split Array Largest Sum (LC 410), and a large chunk of "minimize the maximum / maximize the minimum" problems that don't look like search problems on first read.

## Choosing `[lo, hi]` vs `[lo, hi)`

Both conventions are correct; picking consistently within one function matters more than which one you pick.

| | Closed `[lo, hi]` | Half-open `[lo, hi)` |
|---|---|---|
| Init | `hi = arr.length - 1` | `hi = arr.length` |
| Loop condition | `lo <= hi` | `lo < hi` |
| Shrink on "too small" | `lo = mid + 1` | `lo = mid + 1` |
| Shrink on "too big" | `hi = mid - 1` | `hi = mid` |
| Natural fit | exact match / -1 | boundary-finding (first true, insert position) |

The half-open version's advantage shows up specifically in boundary problems: there's never a separate "did I find it" flag, because when the loop ends `lo === hi` and that value *is* the answer.

## Complexity

| | Linear search | Binary search |
|---|---|---|
| Time | O(n) | O(log n) |
| Space | O(1) | O(1) iterative, O(log n) recursive (call stack) |
| Precondition | none | sorted / monotonic |

## Pitfalls that actually cost points

- **Infinite loops from the wrong shrink.** In the closed-interval template, `lo = mid + 1` / `hi = mid - 1` are both required — using plain `hi = mid` there can leave `lo`/`hi` unchanged forever when `mid === lo`.
- **Mixing conventions inside one function.** Starting with `hi = arr.length - 1` (closed) but looping on `lo < hi` (half-open logic) produces silent off-by-one bugs that only show up on specific input sizes.
- **Forgetting duplicates exist.** A plain exact-match binary search returns *some* matching index, not necessarily the first or last — reach for variant 2 or 3 explicitly when the problem asks for a boundary.
- **Applying binary search to non-monotonic data.** It only works when the comparison at `mid` reliably tells you which half to discard — rotated array and peak-finding variants work because that property still holds in a different form, not because binary search "usually works on sorted-ish things."
- **Not recognizing binary-search-on-answer shapes.** If a problem asks to minimize/maximize some value subject to a feasibility constraint, and brute-force would mean testing every possible value linearly, check whether the feasibility function is monotonic before reaching for a slower approach.

## Practice checklist

- Find First and Last Position of Element in Sorted Array — LC 34 (variants 2 + 3 together)
- Search Insert Position — LC 35
- Search in Rotated Sorted Array — LC 33
- Find Peak Element — LC 162
- Koko Eating Bananas — LC 875 (binary search on answer)
- Capacity To Ship Packages Within D Days — LC 1011 (binary search on answer)
- Split Array Largest Sum — LC 410 (binary search on answer)
- Median of Two Sorted Arrays — LC 4 (binary search across two arrays — a harder combination of these ideas)
