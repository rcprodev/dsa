class Node {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

export class SinglyLinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  insertAtHead(val) {
    const node = new Node(val, this.head);
    this.head = node;
    if (!this.tail) this.tail = node;
    this.size++;
  }

  insertAtTail(val) {
    const node = new Node(val);
    if (!this.head) {
      this.head = this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.size++;
  }
}
