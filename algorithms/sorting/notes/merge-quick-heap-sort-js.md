# Merge Sort, Quick Sort, Heap Sort — JavaScript

## Why these three, together

Unlike bubble/insertion/selection, these are the sorts you'd actually reach for — all three hit O(n log n) in typical or worst cases, and together they cover the three fundamental strategies for beating O(n²): divide-and-conquer with a combine step (merge sort), divide-and-conquer with an in-place partition (quick sort), and building an implicit tree structure over the array itself (heap sort). Knowing all three, and specifically *why* each one gets to O(n log n), is what separates "I memorized an algorithm" from "I understand sorting."

| | Time (worst) | Time (average) | Space | Stable | In-place |
|---|---|---|---|---|---|
| Merge sort | O(n log n) | O(n log n) | O(n) | yes | no |
| Quick sort | O(n²) | O(n log n) | O(log n) (stack) | no | yes |
| Heap sort | O(n log n) | O(n log n) | O(1) | no | yes |

## Merge sort — divide and conquer, guaranteed

Split the array in half recursively down to single elements (trivially sorted), then merge sorted halves back together. The diagram above shows exactly that merge step: two pointers walking their respective sorted halves, always taking the smaller front element.

```javascript
function mergeSort(arr) {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) result.push(left[i++]); // <= not < — this is what keeps it stable
    else result.push(right[j++]);
  }
  // append whichever side has leftovers
  while (i < left.length) result.push(left[i++]);
  while (j < right.length) result.push(right[j++]);

  return result;
}
```
The `<=` in the comparison is the detail that makes merge sort stable: when the two front elements are equal, always taking from the left half preserves their original relative order. Flip it to `<` and stability breaks silently.

**Why O(n log n) guaranteed, no worst case:** the split is always exactly in half regardless of input — that's what gives the `log n` levels of recursion. Each level does O(n) total work merging, so it's `O(n) × O(log n)` no matter how the input is arranged. That guarantee is the whole selling point over quicksort.

**The cost:** the `result = []` array at every merge means O(n) auxiliary space, and this recursive version above also isn't in-place — `arr.slice()` allocates new arrays at every level. An in-place merge sort exists but is significantly more complex and rarely worth it in an interview setting; know that the trade-off exists rather than trying to implement it live.

Merge sort's stability and predictable O(n log n) are exactly why it's the standard choice for **external sorting** (data too large for memory — merge sorted chunks from disk) and why it's the backbone of Timsort (Python's and JS engines' actual `sort()` implementation in many cases, which is a hybrid of merge sort and insertion sort for small runs).

## Quick sort — in-place, average-case O(n log n)

Pick a pivot, partition the array so everything smaller ends up left of it and everything larger ends up right, then recurse on each side. Unlike merge sort, the "hard work" happens *before* the recursion (partitioning), not after (merging) — and it happens in-place.

```javascript
function quickSort(arr, lo = 0, hi = arr.length - 1) {
  if (lo >= hi) return arr;

  const pivotIndex = partition(arr, lo, hi);
  quickSort(arr, lo, pivotIndex - 1);
  quickSort(arr, pivotIndex + 1, hi);
  return arr;
}

function partition(arr, lo, hi) {
  // randomized pivot — swap a random element into the last slot first
  const randomIndex = lo + Math.floor(Math.random() * (hi - lo + 1));
  [arr[randomIndex], arr[hi]] = [arr[hi], arr[randomIndex]];

  const pivot = arr[hi];
  let i = lo; // boundary: everything before i is < pivot

  for (let j = lo; j < hi; j++) {
    if (arr[j] < pivot) {
      [arr[i], arr[j]] = [arr[j], arr[i]];
      i++;
    }
  }
  [arr[i], arr[hi]] = [arr[hi], arr[i]]; // place pivot in its final spot
  return i;
}
```
This is Lomuto partitioning (single boundary pointer `i`, pivot fixed at the end) — the version to default to, since it's easier to reason about and explain than the alternative (Hoare partitioning, which uses two inward-moving pointers and is faster in practice but trickier to get exactly right under pressure).

**Why the random pivot matters — this is the detail worth being able to explain unprompted:** picking a fixed pivot (always first, or always last element) means an already-sorted or reverse-sorted input degrades every partition to a 1-vs-(n−1) split, giving O(n²) worst case. Randomizing the pivot makes that worst case astronomically unlikely for any *specific* adversarial input, turning the practical behavior into expected O(n log n) regardless of input order. This is the single most common quicksort follow-up question: "what's the worst case, and how do you avoid it?"

**Why in-place matters:** no auxiliary array — the swaps happen directly within `arr`. That's quicksort's main advantage over merge sort when memory is a constraint, at the cost of losing the stability and worst-case guarantees merge sort has.

## Heap sort — in-place, guaranteed O(n log n), no recursion needed for the sort itself

Build a max-heap from the array (an implicit binary tree stored in a flat array, where every parent is ≥ its children), then repeatedly swap the max (root) to the end and shrink the heap, re-heapifying each time.

```javascript
function heapSort(arr) {
  const n = arr.length;

  // build max heap — start from the last non-leaf node, work backward
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(arr, n, i);
  }

  // repeatedly extract the max, shrink the heap
  for (let end = n - 1; end > 0; end--) {
    [arr[0], arr[end]] = [arr[end], arr[0]];
    heapify(arr, end, 0); // re-heapify the reduced heap
  }
  return arr;
}

function heapify(arr, heapSize, root) {
  let largest = root;
  const left = 2 * root + 1;
  const right = 2 * root + 2;

  if (left < heapSize && arr[left] > arr[largest]) largest = left;
  if (right < heapSize && arr[right] > arr[largest]) largest = right;

  if (largest !== root) {
    [arr[root], arr[largest]] = [arr[largest], arr[root]];
    heapify(arr, heapSize, largest); // sift down the swapped element
  }
}
```
The array-as-tree indexing (`2*i+1` for left child, `2*i+2` for right child, `Math.floor((i-1)/2)` for parent — not needed here but worth knowing) is the same indexing scheme behind a from-scratch priority queue, which is why heap sort and "implement a heap" interview questions share almost all their logic.

**Why building the heap is O(n), not O(n log n):** this genuinely surprises people the first time. Calling `heapify` on n elements looks like O(n log n) at a glance, but most nodes are near the *bottom* of the tree and sift down only a short distance — the math works out to O(n) total for the build phase. The O(n log n) in heap sort's total complexity comes from the extraction loop (n extractions, each an O(log n) re-heapify), not the build.

**Why it's the safest guarantee of the three:** O(n log n) worst case (unlike quicksort) and O(1) space (unlike merge sort) — but it's not stable, and in practice it tends to have worse constant factors than a well-implemented quicksort because heap operations don't have the cache-friendly sequential access pattern that partitioning does.

## Choosing between them

| Constraint | Pick |
|---|---|
| Need stability | Merge sort |
| Need worst-case guarantee, memory is tight | Heap sort |
| Average-case speed matters most, memory isn't tight | Quick sort (randomized pivot) |
| Nearly-sorted or small input | Insertion sort (from the previous guide) beats all three |
| Data too large for memory | Merge sort (external sorting) |
| Just need the top-k, not a full sort | Quickselect (below) or a heap of size k |

If an interviewer just says "sort this" with no constraint, quicksort with a randomized pivot is the strongest default answer — it's what most general-purpose library sorts are actually built on (often as introsort: quicksort that falls back to heap sort if recursion gets too deep, to guarantee against the O(n²) worst case).

## Bonus: Quickselect — finding the kth element without a full sort

Same partitioning logic as quicksort, but you only recurse into the *one* side that contains the index you're looking for — this drops the expected time from O(n log n) to O(n).

```javascript
function quickSelect(arr, k, lo = 0, hi = arr.length - 1) {
  // k is 0-indexed position in the fully sorted array
  if (lo === hi) return arr[lo];

  const pivotIndex = partition(arr, lo, hi); // same partition function as quicksort

  if (k === pivotIndex) return arr[k];
  if (k < pivotIndex) return quickSelect(arr, k, lo, pivotIndex - 1);
  return quickSelect(arr, k, pivotIndex + 1, hi);
}

// Kth largest = quickSelect(arr, arr.length - k)
```
This is the standard answer to "find the kth largest/smallest element" (LC 215) when the interviewer wants better than O(n log n) — recognizing that you don't need to sort the *whole* array to answer a single positional query is the insight being tested.

## Pitfalls that actually cost points

- **Fixed pivot choice in quicksort.** Always picking `arr[hi]` or `arr[lo]` as pivot with no randomization is the single most common quicksort mistake — it's correct but degrades to O(n²) on sorted or reverse-sorted input, which is a very ordinary real-world case, not an obscure adversarial one.
- **Forgetting `<=` vs `<` in merge sort's comparison.** Determines stability; get asked "is your sort stable?" and you should be able to point at that exact line.
- **Confusing heap sort's build phase complexity.** Saying "building the heap is O(n log n)" is the most common heap sort mistake — it's O(n), and being able to justify why (most nodes are near the bottom, sifting a short distance) is the actual test.
- **Off-by-one in heapify's child indices.** `2*i + 1` and `2*i + 2` for 0-indexed arrays — easy to transpose or use 1-indexed formulas by habit and get silently wrong results on non-trivial inputs.
- **Not shrinking the heap size on each extraction in heap sort.** `heapify(arr, end, 0)` — the second argument must shrink each iteration, or already-sorted elements at the end get treated as still part of the heap.
- **Assuming any of these three are stable by default.** Only merge sort is (and only with a careful `<=` comparison). Quicksort and heap sort are not stable in their standard forms.

## Practice checklist

- Sort an Array — LC 912 (implement any O(n log n) sort from scratch — the direct test of this guide)
- Kth Largest Element in an Array — LC 215 (quickselect)
- Merge k Sorted Lists — LC 23 (merge sort's merge step generalized to k-way)
- Sort List — LC 148 (merge sort on a linked list — no random access, so the split/merge logic changes shape)
- Top K Frequent Elements — LC 347 (heap, or quickselect on frequency counts)
- Kth Smallest Element in a Sorted Matrix — LC 378 (heap-based, a step up in combining structures)
