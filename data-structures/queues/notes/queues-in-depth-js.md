# Queues in Depth — JavaScript

## The core idea

First in, first out — the mirror image of the stack you just covered. Enqueue adds at the rear, dequeue removes from the front. Nothing else touches the middle. That single ordering guarantee is why queues are the mechanism behind BFS, task scheduling, rate limiting, and any "process things in the order they arrived" problem.

| | Stack | Queue |
|---|---|---|
| Order | LIFO | FIFO |
| Add | top | rear |
| Remove | top | front |
| Typical use | recursion, undo, matching/parsing | BFS, scheduling, streaming order |

## Array-based — the naive version, and why it's a trap

```javascript
class NaiveQueue {
  constructor() {
    this.items = [];
  }
  enqueue(val) { this.items.push(val); }   // O(1) — end of array
  dequeue() { return this.items.shift(); } // O(n) — everything shifts left
}
```
This compiles, passes small tests, and is the single most common queue bug in interviews: `shift()` re-indexes every remaining element, so a queue built this way is secretly O(n) per dequeue — O(n²) over a full run. Don't reach for it unless the problem is tiny and it's genuinely not the point being tested.

## Array-based — circular buffer (true O(1))

Fixed-size backing array, two pointers (`front`, `rear`) that wrap around with modulo instead of shifting data.

```javascript
class CircularQueue {
  constructor(capacity) {
    this.items = new Array(capacity);
    this.capacity = capacity;
    this.front = 0;
    this.count = 0;
  }
  enqueue(val) {
    if (this.count === this.capacity) throw new Error('Queue is full');
    const rear = (this.front + this.count) % this.capacity;
    this.items[rear] = val;
    this.count++;
  }
  dequeue() {
    if (this.count === 0) return undefined;
    const val = this.items[this.front];
    this.front = (this.front + 1) % this.capacity;
    this.count--;
    return val;
  }
  isEmpty() { return this.count === 0; }
  isFull() { return this.count === this.capacity; }
}
```
The modulo is what makes wraparound work: once `rear` or `front` reaches the end of the backing array, `% this.capacity` snaps it back to index 0 instead of running off the end. This is the version to reach for when the interview specifically wants O(1) enqueue *and* dequeue with array-backed storage — think ring buffers, LC 622 (Design Circular Queue).

## Linked-list-based — unbounded, still O(1)

No capacity limit, and no modulo arithmetic — you're just tracking head and tail pointers the same way you did for the linked list's tail insert.

```javascript
class QueueNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

class LinkedQueue {
  constructor() {
    this.front = null;
    this.rear = null;
    this._size = 0;
  }
  enqueue(val) {
    const node = new QueueNode(val);
    if (!this.rear) {
      this.front = this.rear = node;
    } else {
      this.rear.next = node;
      this.rear = node;
    }
    this._size++;
  }
  dequeue() {
    if (!this.front) return undefined;
    const val = this.front.val;
    this.front = this.front.next;
    if (!this.front) this.rear = null; // queue just became empty
    this._size--;
    return val;
  }
  isEmpty() { return this.front === null; }
  get size() { return this._size; }
}
```
Same failure mode as the linked list's tail pointer: forget to null out `rear` when the last element is dequeued, and the next `enqueue` silently attaches to a dangling node instead of starting fresh.

| Operation | Naive array (`shift`) | Circular buffer | Linked list |
|---|---|---|---|
| enqueue | O(1) | O(1) | O(1) |
| dequeue | O(n) | O(1) | O(1) |
| Capacity | unbounded | fixed | unbounded |

## Queue from two stacks

You built this in the stacks guide (`QueueViaStacks`) — worth remembering the direction of the trick since it also runs in reverse: a stack can be built from two queues, though that's asked far less often. The core insight both directions share: reversing order twice restores the original order, which is exactly what moving every element from one structure to another and back accomplishes.

## Pattern: monotonic deque (Sliding Window Maximum, LC 239)

The queue equivalent of the monotonic stack — but here you need access to *both* ends, so the structure is a deque (double-ended queue), not a plain queue. Keep indices in the deque with strictly decreasing values; the front is always the current window's maximum.

```javascript
function maxSlidingWindow(nums, k) {
  const deque = []; // stores indices, values decreasing front to back
  const result = [];

  for (let i = 0; i < nums.length; i++) {
    // drop indices that fell out of the window
    if (deque.length && deque[0] <= i - k) deque.shift();

    // drop smaller values from the back — they can never be the max
    // while nums[i] is still in the window
    while (deque.length && nums[deque[deque.length - 1]] < nums[i]) {
      deque.pop();
    }
    deque.push(i);

    if (i >= k - 1) result.push(nums[deque[0]]);
  }
  return result;
}
```
Same amortized-O(n) argument as the monotonic stack: each index enters and leaves the deque at most once. In production code you'd back this with a proper double-ended structure (or a circular buffer) since `Array.shift()` here is O(n) — for interview purposes this version is accepted because it makes the pattern clearest, but it's worth naming the same caveat you'd give for the naive queue above if asked to make it fully O(1).

## Queues and BFS

This is the pattern queues exist for in graph/tree problems: process the current level completely before moving to the next, which is exactly FIFO order applied to "nodes discovered so far."

```javascript
function bfs(root) {
  if (!root) return [];
  const queue = [root];
  const result = [];
  while (queue.length) {
    const node = queue.shift(); // small trees: fine. Large/perf-sensitive: use a proper queue
    result.push(node.val);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }
  return result;
}
```
Contrast with the DFS-via-explicit-stack you wrote for the stacks guide: same traversal skeleton (loop, pop/shift, push children), different structure, genuinely different visiting order. That side-by-side is a strong thing to be able to state out loud in an interview — it shows you understand *why* the structure choice changes the order, not just that it does.

Level-order variants (LC 102 Binary Tree Level Order Traversal) track level boundaries by snapshotting `queue.length` before the inner loop starts:
```javascript
function levelOrder(root) {
  if (!root) return [];
  const queue = [root];
  const levels = [];
  while (queue.length) {
    const levelSize = queue.length; // boundary snapshot — must be read before the loop
    const level = [];
    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    levels.push(level);
  }
  return levels;
}
```

## A note on priority queues

Worth flagging even though it's a different structure: a priority queue (usually backed by a binary heap, not a plain array/linked list) removes the *highest-priority* element rather than the oldest one — it drops FIFO order entirely in favor of ordering by value. JS has no built-in heap, so priority queue problems (K Closest Points, Merge K Sorted Lists, Top K Frequent Elements) usually mean implementing a small binary heap by hand or using a sorted structure. That's a big enough topic to treat as its own session rather than folding it into "queues" — flag it for when you get to heaps.

## Pitfalls that actually cost points

- **`shift()`/`unshift()` treated as free.** They're O(n). Fine for small inputs or when the pattern is the point being tested; call it out explicitly if asked about performance at scale.
- **Forgetting to null `rear`** when a linked-list queue empties out — the next enqueue silently corrupts the structure.
- **Reading `queue.length` inside the level-order loop** instead of snapshotting it before — the length changes as you push children, so the boundary drifts and levels bleed into each other.
- **Off-by-one on circular buffer wraparound** — always compute the next index with modulo (`(index + 1) % capacity`), never plain increment.
- **Confusing deque direction** in monotonic-deque problems — popping from the wrong end silently turns a sliding-window-maximum solution into nonsense that still runs without erroring.

## Practice checklist

- Design Circular Queue — LC 622
- Sliding Window Maximum — LC 239 (monotonic deque)
- Binary Tree Level Order Traversal — LC 102
- Number of Islands — LC 200 (BFS/DFS on a grid)
- Rotting Oranges — LC 994 (multi-source BFS)
- Implement Stack using Queues — LC 225 (the reverse direction of what you built)
- Design Hit Counter — LC 362 (queue as a sliding time window)
