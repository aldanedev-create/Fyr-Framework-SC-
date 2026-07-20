import { Fyr } from "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr.esm.js";

const starterTodos = [
  { id: "read", title: "Read the Fyr docs", done: true },
  { id: "build", title: "Build a small reactive app", done: false },
  { id: "ship", title: "Share the result", done: false },
];
const app = Fyr.createApp("todo-demo", {
  state: { todos: starterTodos, visibleTodos: starterTodos, draft: "", filter: "all", isEmpty: false },
  computed: { remainingLabel() { return `${this.state.todos.filter(todo => !todo.done).length} task(s) remaining`; } },
  methods: {
    addTodo() { const title = this.state.draft.trim(); if (!title) return; this.state.todos = [{ id: String(Date.now()), title, done: false }, ...this.state.todos]; this.state.draft = ""; filterTodos(this.state); },
    toggleTodo(id) { this.state.todos = this.state.todos.map(todo => todo.id === id ? { ...todo, done: !todo.done } : todo); filterTodos(this.state); },
    removeTodo(id) { this.state.todos = this.state.todos.filter(todo => todo.id !== id); filterTodos(this.state); },
    setFilter(filter) { this.state.filter = filter; filterTodos(this.state); },
    clearDone() { this.state.todos = this.state.todos.filter(todo => !todo.done); filterTodos(this.state); },
  },
});
Fyr.start("todo-demo");
function filterTodos(state) { state.visibleTodos = state.todos.filter(todo => state.filter === "all" || (state.filter === "done" ? todo.done : !todo.done)); state.isEmpty = state.visibleTodos.length === 0; }
