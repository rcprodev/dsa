# Stacks in Depth — JavaScript

## The core idea

Last in, first out. You only ever touch the top: push adds there, pop removes from there, peek looks without removing. Everything else about a stack is a consequence of that one restriction.

It shows up in more places than the explicit "use a stack" problems suggest — the JS call stack itself is a stack (which is why deep recursion overflows it), undo/redo history, browser back/forward, and expression parsing all lean on the same LIFO shape.

## Array-based implementation

JavaScript arrays already have O(1) amortized `push`/`pop` at the end, so wrapping one is the natural default.

```javascript
class Stack {
  constructor() {
    this.items = [];
  }
  push(val) { this.items.push(val); }
  pop() { return this.items.pop(); }        // undefined if empty
  peek() { return this.items[this.items.length - 1]; }
  isEmpty() { return this.items.length === 0; }
  get size() { return this.items.length; }
}
```
`push`/`pop` at the *front* of an array (`unshift`/`shift`) are O(n) — every other element has to move. That's the one array-based mistake worth being explicit about: a stack only works at O(1) if you operate on the end.

## Linked-list-based implementation

Push/pop become "add/remove at head" — no shifting, no amortized cost, true O(1) every time, and no resizing behavior to reason about.

```javascript
class StackNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

class LinkedStack {
  constructor() {
    this.top = null;
    this._size = 0;
  }
  push(val) {
    this.top = new StackNode(val, this.top);
    this._size++;
  }
  pop() {
    if (!this.top) return undefined;
    const val = this.top.val;
    this.top = this.top.next;
    this._size--;
    return val;
  }
  peek() { return this.top ? this.top.val : undefined; }
  isEmpty() { return this.top === null; }
  get size() { return this._size; }
}
```

| Operation | Array-based | Linked-list-based |
|---|---|---|
| push | O(1) amortized | O(1) always |
| pop | O(1) | O(1) |
| peek | O(1) | O(1) |
| Extra memory | none beyond values | one pointer per node |

In an interview, the array version is the default choice unless the problem specifically wants you to reason about pointers (or you're building the stack itself as the exercise).

## Pattern: matching / validity (Valid Parentheses, LC 20)

Push opening symbols, and on a closing symbol check the top matches — the canonical "does this nested structure balance" check.

```javascript
function isValid(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const ch of s) {
    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch);
    } else {
      if (stack.pop() !== pairs[ch]) return false;
    }
  }
  return stack.length === 0; // nothing left unmatched
}
```
Two failure modes to check explicitly: a closing bracket when the stack is empty (`stack.pop()` returns `undefined`, which correctly fails the comparison), and leftover opening brackets at the end (the final length check).

## Pattern: Min Stack (LC 155) — O(1) getMin

The trick: keep a second stack that tracks the minimum *at each point in time*, pushed and popped in lockstep with the main stack.

```javascript
class MinStack {
  constructor() {
    this.stack = [];
    this.minStack = []; // minStack[i] = min of stack[0..i]
  }
  push(val) {
    this.stack.push(val);
    const currMin = this.minStack.length
      ? Math.min(val, this.minStack[this.minStack.length - 1])
      : val;
    this.minStack.push(currMin);
  }
  pop() {
    this.stack.pop();
    this.minStack.pop(); // stays in sync — same index, same lifetime
  }
  top() { return this.stack[this.stack.length - 1]; }
  getMin() { return this.minStack[this.minStack.length - 1]; }
}
```
Why not just track a single `min` variable? Because popping the current minimum would leave you with no way to know the *previous* minimum without rescanning — O(n) instead of O(1). The parallel stack remembers the whole history of minimums, not just the current one.

Space-optimized variant (one stack, store deltas) exists too, but the two-stack version is the one to produce fluently first — it's the version that generalizes to `getMax`, `getSum`, or any other running aggregate.

## Pattern: monotonic stack

Keep the stack strictly increasing (or decreasing) by popping elements that violate the order before pushing the new one. Whatever gets popped just found its answer — the new element is the "next greater" (or "next smaller") thing it was waiting for.

**Next Greater Element:**
```javascript
function nextGreaterElement(nums) {
  const result = new Array(nums.length).fill(-1);
  const stack = []; // stores indices, kept decreasing by value

  for (let i = 0; i < nums.length; i++) {
    while (stack.length && nums[stack[stack.length - 1]] < nums[i]) {
      const idx = stack.pop();
      result[idx] = nums[i];
    }
    stack.push(i);
  }
  return result;
}
```
This runs in O(n) total even though there's a nested `while` — each index is pushed once and popped at most once, so the amortized cost per element is O(1). That amortized-O(n) argument is worth being able to say out loud; it's the part that makes the pattern non-obvious the first time you see it.

Same skeleton solves: Daily Temperatures (LC 739), Largest Rectangle in Histogram (LC 84, monotonic stack of bar heights), and Trapping Rain Water's stack-based solution.

## Pattern: evaluate expressions (RPN, calculators)

**Evaluate Reverse Polish Notation (LC 150):**
```javascript
function evalRPN(tokens) {
  const stack = [];
  const ops = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => Math.trunc(a / b), // truncate toward zero, not floor
  };
  for (const tok of tokens) {
    if (tok in ops) {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(ops[tok](a, b));
    } else {
      stack.push(Number(tok));
    }
  }
  return stack.pop();
}
```
Order matters on subtraction and division: the second-popped value (`a`) is the left operand, the first-popped (`b`) is the right. Reversing them is a common silent bug since addition and multiplication don't expose the mistake.

Basic Calculator-style problems (with parens and precedence) extend this same idea with an operator stack alongside the value stack, or by pre-converting infix to postfix.

## Stacks and queues, built from each other

A classic pair of "implement X using only Y" problems that tests whether you actually understand the ordering guarantee each structure makes.

**Queue using two stacks** (amortized O(1) per operation):
```javascript
class QueueViaStacks {
  constructor() {
    this.inStack = [];
    this.outStack = [];
  }
  enqueue(val) { this.inStack.push(val); }
  dequeue() {
    if (!this.outStack.length) {
      while (this.inStack.length) this.outStack.push(this.inStack.pop());
    }
    return this.outStack.pop();
  }
}
```
Each element is moved from `inStack` to `outStack` at most once across its lifetime, so the cost amortizes to O(1) even though a single `dequeue` can occasionally be O(n).

## Stacks and recursion

Every recursive call pushes a frame (arguments, local variables, return address) onto the actual call stack; returning pops it. That's not an analogy — it's literally what's happening under the hood, and it's why:
- Deep unbounded recursion throws `RangeError: Maximum call stack size exceeded`.
- Any recursive solution can be rewritten iteratively with an explicit stack (useful for DFS on trees/graphs when recursion depth risks overflow, or when an interviewer explicitly asks for the iterative version).

**Iterative DFS as an explicit-stack rewrite:**
```javascript
function dfsIterative(root) {
  if (!root) return [];
  const stack = [root];
  const result = [];
  while (stack.length) {
    const node = stack.pop();
    result.push(node.val);
    if (node.right) stack.push(node.right); // push right first
    if (node.left) stack.push(node.left);   // so left pops first
  }
  return result;
}
```

## Pitfalls that actually cost points

- **Popping an empty stack silently.** `[].pop()` returns `undefined` in JS rather than throwing — code that doesn't guard for it produces wrong answers instead of a crash, which is worse in an interview because it looks like it worked.
- **Using `unshift`/`shift`** when you meant `push`/`pop` — same LIFO logic, but now every operation is O(n).
- **Losing sync between parallel stacks** (as in Min Stack) — every push/pop on the main stack needs the matching push/pop on the auxiliary one, even when the auxiliary value doesn't change.
- **Operand order in non-commutative ops** (RPN subtraction/division) — always double-check which popped value is the left operand.
- **Forgetting the final "stack empty" check** in matching/validity problems — a string like `"((("` never trips a mismatch, so only the trailing length check catches it.

## Practice checklist

Beyond what you've already covered (array-based and linked-list-based stacks, general interview patterns):

- Min Stack — LC 155 *(flagged high priority)*
- Evaluate Reverse Polish Notation — LC 150
- Daily Temperatures — LC 739 (monotonic stack)
- Next Greater Element I & II — LC 496 / LC 503
- Largest Rectangle in Histogram — LC 84
- Implement Queue using Stacks — LC 232
- Implement Stack using Queues — LC 225
- Basic Calculator II — LC 227
- Decode String — LC 394 (stack of partial results, a step up in complexity)
