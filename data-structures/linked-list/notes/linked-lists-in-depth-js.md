# Linked Lists in Depth — JavaScript

## Why a linked list at all

Arrays give you O(1) random access but O(n) insert/delete anywhere except the end (everything has to shift). A linked list flips that trade: O(1) insert/delete once you're at a node, but O(n) to reach a node since there's no indexing — you walk pointer by pointer.

| Operation | Array | Linked List |
|---|---|---|
| Access by index | O(1) | O(n) |
| Search | O(n) | O(n) |
| Insert/delete at start | O(n) | O(1) |
| Insert/delete at end | O(1) amortized | O(1) with tail pointer, else O(n) |
| Insert/delete at known node | O(n) (shift) | O(1) |
| Extra memory per element | none | one (or two) pointers |

That's the whole reason this data structure exists: it trades locality and indexing for cheap structural edits.

## Node and the base class

```javascript
class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }
}
```

## Core operations

### Insert at head — O(1)
```javascript
insertHead(val) {
  const node = new ListNode(val, this.head);
  this.head = node;
  if (!this.tail) this.tail = node; // list was empty
  this.size++;
}
```

### Insert at tail — O(1) with a tail pointer
```javascript
insertTail(val) {
  const node = new ListNode(val);
  if (!this.head) {
    this.head = this.tail = node;
  } else {
    this.tail.next = node;
    this.tail = node;
  }
  this.size++;
}
```
Without a maintained `tail` pointer this becomes O(n) — a very common bug source: forgetting to update `tail` after a tail insert, or after deleting the last node.

### Insert at index — O(n) to walk, O(1) to splice
```javascript
insertAt(index, val) {
  if (index <= 0) return this.insertHead(val);
  if (index >= this.size) return this.insertTail(val);

  let prev = this.head;
  for (let i = 0; i < index - 1; i++) prev = prev.next;

  const node = new ListNode(val, prev.next);
  prev.next = node;
  this.size++;
}
```

### Delete by value — O(n)
```javascript
deleteVal(val) {
  if (!this.head) return false;

  if (this.head.val === val) {
    this.head = this.head.next;
    if (!this.head) this.tail = null;
    this.size--;
    return true;
  }

  let prev = this.head;
  while (prev.next && prev.next.val !== val) prev = prev.next;

  if (!prev.next) return false; // not found
  prev.next = prev.next.next;
  if (!prev.next) this.tail = prev; // deleted the tail
  this.size--;
  return true;
}
```

### Search / traverse — O(n)
```javascript
find(val) {
  let curr = this.head;
  while (curr) {
    if (curr.val === val) return curr;
    curr = curr.next;
  }
  return null;
}
```

## The dummy head pattern

Whenever a problem might modify the head itself (delete duplicates, remove nth from end, partition a list), wrap the real head in a sentinel node. It erases the "is this the first node?" special case, so head deletion and mid-list deletion become the same code path.

```javascript
function removeElements(head, val) {
  const dummy = new ListNode(0, head);
  let curr = dummy;
  while (curr.next) {
    if (curr.next.val === val) curr.next = curr.next.next;
    else curr = curr.next;
  }
  return dummy.next;
}
```
Return `dummy.next`, not `dummy` — that's the actual head after edits.

## Reversal

### Iterative — O(n) time, O(1) space
```javascript
function reverse(head) {
  let prev = null;
  let curr = head;
  while (curr) {
    const next = curr.next; // save before overwriting
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev; // new head
}
```
This is the single most-reused pattern in linked list interviews — reversing a sublist, reversing in groups of k, palindrome checks, and reordering lists all build on this three-pointer shuffle.

### Recursive — O(n) time, O(n) space (call stack)
```javascript
function reverseRecursive(head) {
  if (!head || !head.next) return head;
  const newHead = reverseRecursive(head.next);
  head.next.next = head;
  head.next = null;
  return newHead;
}
```

## Fast and slow pointers (Floyd's algorithm)

One pointer moves 1 step, the other moves 2. This single trick answers three different questions:

**Find the middle:**
```javascript
function findMiddle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow; // second middle if even length
}
```

**Detect a cycle:**
```javascript
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
```

**Find where the cycle starts** (the classic follow-up to the above): once `slow === fast` inside the loop, reset one pointer to `head` and advance both one step at a time — they meet exactly at the cycle's entry node. This works because of the distance math between the meeting point and the entry point; it's worth memorizing the result even if you don't re-derive it in an interview.
```javascript
function cycleStart(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      let ptr = head;
      while (ptr !== slow) { ptr = ptr.next; slow = slow.next; }
      return ptr;
    }
  }
  return null;
}
```

## Merging two sorted lists — O(n + m)

Dummy head again, because the result's head depends on which list starts smaller.

```javascript
function mergeTwoLists(l1, l2) {
  const dummy = new ListNode(0);
  let curr = dummy;
  while (l1 && l2) {
    if (l1.val <= l2.val) { curr.next = l1; l1 = l1.next; }
    else { curr.next = l2; l2 = l2.next; }
    curr = curr.next;
  }
  curr.next = l1 || l2; // attach whichever list has leftovers
  return dummy.next;
}
```

## Palindrome check — O(n) time, O(1) space

Combine three patterns you already have: find the middle, reverse the second half, compare.

```javascript
function isPalindrome(head) {
  let slow = head, fast = head;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }

  let secondHalf = reverse(slow);
  let firstHalf = head;
  while (secondHalf) {
    if (firstHalf.val !== secondHalf.val) return false;
    firstHalf = firstHalf.next;
    secondHalf = secondHalf.next;
  }
  return true;
}
```

## Doubly linked list

Trades extra memory (a `prev` pointer per node) for O(1) backward traversal and O(1) removal of a *known* node without needing its predecessor — the property the LRU Cache pattern depends on.

```javascript
class DListNode {
  constructor(val, key = null) {
    this.key = key; // often needed when paired with a Map (see LRU below)
    this.val = val;
    this.prev = null;
    this.next = null;
  }
}

class DoublyLinkedList {
  constructor() {
    // sentinel head/tail remove all edge cases for empty-list / single-node ops
    this.head = new DListNode(null);
    this.tail = new DListNode(null);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  // insert right after head — O(1)
  addFront(node) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
  }

  // detach a known node from wherever it sits — O(1)
  remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }
}
```

The sentinel-node trick (fake head + fake tail that are never real data) is the doubly linked list's version of the dummy head — it means `addFront` and `remove` never have to check "is this the first/last real node?"

## Worked example: LRU Cache (LC 146)

This is the canonical "linked list + hash map" interview problem, and it's the reason the doubly linked list pattern above exists in this exact shape. The map gives O(1) lookup by key; the doubly linked list gives O(1) reordering and eviction.

```javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // key -> DListNode
    this.dll = new DoublyLinkedList();
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const node = this.map.get(key);
    this.dll.remove(node);
    this.dll.addFront(node); // most recently used goes to front
    return node.val;
  }

  put(key, value) {
    if (this.map.has(key)) {
      const node = this.map.get(key);
      node.val = value;
      this.dll.remove(node);
      this.dll.addFront(node);
      return;
    }
    if (this.map.size >= this.capacity) {
      const lru = this.dll.tail.prev; // node just before sentinel tail
      this.dll.remove(lru);
      this.map.delete(lru.key);
    }
    const node = new DListNode(value, key);
    this.dll.addFront(node);
    this.map.set(key, node);
  }
}
```
Every operation here is O(1) — that's the whole point of pairing the two structures.

## Pitfalls that actually cost points in interviews

- **Losing the rest of the list.** In reversal, always save `curr.next` *before* you overwrite `curr.next = prev`. This is the #1 bug.
- **Forgetting to update `tail`** after deleting the last node, or after a tail insert on an empty list.
- **Off-by-one on "nth from end."** Standard fix: move a lead pointer `n` steps ahead first, then move both pointers together until the lead hits null.
- **Null-checking `fast.next` as well as `fast`** in fast/slow loops — `fast.next.next` crashes if you only checked `fast`.
- **Not returning `dummy.next`** after using a dummy head — returning `dummy` itself is a silent, easy-to-miss bug.
- **Infinite loops from mis-wired pointers** — after any manual pointer surgery, mentally trace 2–3 nodes forward before trusting the code.

## Practice checklist

Given where you are in the roadmap, these round out the pattern set beyond what you've already drilled (reversal, Floyd's, dummy head, merge):

- LRU Cache — LC 146 *(flagged high priority)*
- Reorder List — LC 143 *(flagged high priority — reversal + merge combined)*
- Reverse Nodes in k-Group — LC 25
- Copy List with Random Pointer — LC 138
- Add Two Numbers — LC 2
- Remove Nth Node From End of List — LC 19
- Odd Even Linked List — LC 328
- Flatten a Multilevel Doubly Linked List — LC 430
