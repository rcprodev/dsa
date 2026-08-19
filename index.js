import { SinglyLinkedList } from "./linked-list/singlyLinkedList.js";

const ssl = new SinglyLinkedList();

ssl.insertAtHead(10);
ssl.insertAtHead(20);
ssl.insertAtHead(30);
ssl.insertAtTail(5);
console.log(JSON.stringify(ssl));
