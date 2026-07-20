# API reference

Fyr is distributed as `@aldane-dev-create/fyr`. Use the ESM bundle in a browser or install it with npm:

~~~bash
npm install @aldane-dev-create/fyr
~~~

~~~js
import { Fyr } from "@aldane-dev-create/fyr";
~~~

## Core API

| API | Purpose | Example |
| --- | --- | --- |
| `Fyr.createApp(name, definition)` | Create state, computed values, and methods for a `fyr-app` root. | [counter](../examples/counter/) |
| `Fyr.start(name)` | Mount an existing application. | [getting started](getting-started.md) |
| `Fyr.destroyApp(name)` | Unmount an application and clean up effects. | Use before removing a mounted root yourself. |
| `Fyr.getApp(name)` / `Fyr.hasApp(name)` | Inspect registered app instances. | Useful for integration tests. |
| `Fyr.configure(options)` | Set framework configuration. | Keep configuration at application startup. |
| `Fyr.nextTick(callback)` | Run work after Fyr finishes its current update work. | Measure a newly rendered element. |
| `Fyr.emit(name, data)` / `Fyr.on(name, handler)` | In-process event bus. | Use for decoupled browser-only features. |
| `Fyr.notify` | Toast helpers: `success`, `error`, `warning`, `info`. | [Flask classroom](../examples/flask-api/) |
| `Fyr.http` | Fetch-based JSON client. | [HTTP](http.md) |
| `Fyr.action.call(name, data)` | Server-action client. | [server actions](server-actions.md) |

## Directives

Use directives only inside a mounted `fyr-app`. Expressions use app state, computed values, methods, and `fyr-for` item scope.

| Directive | What it does | Minimal example |
| --- | --- | --- |
| `fyr-app` | Marks the mount root. | `<main fyr-app="dashboard">` |
| `fyr-controller` | Declares a nested registered controller root. | `<section fyr-controller="profile">` |
| `fyr-text` | Writes text safely. | `<span fyr-text="user.name"></span>` |
| `fyr-html` | Writes raw HTML. Trusted content only. | `<div fyr-html="trustedMarkup"></div>` |
| `fyr-click` | Calls a method on click. | `<button fyr-click="save()">Save</button>` |
| `fyr-on:event` | Listens for a browser event. | `<input fyr-on:input="search()">` |
| `fyr-submit` | Handles a form submit. | `<form fyr-submit="createTodo()">` |
| `fyr-model` | Two-way form binding. | `<input fyr-model="draft">` |
| `fyr-show` | Toggles element visibility. | `<p fyr-show="isReady">Ready</p>` |
| `fyr-if` | Conditional element handling. | `<aside fyr-if="isAdmin">…</aside>` |
| `fyr-for` | Repeats a `<template>` for an array. | `<template fyr-for="todo in visibleTodos">…</template>` |
| `fyr-key` | Enables keyed reconciliation within `fyr-for`. | `<template fyr-for="todo in todos" fyr-key="todo.id">` |
| `fyr-bind:attr` | Binds an HTML attribute. | `<button fyr-bind:disabled="saving">` |
| `fyr-class` | Binds class values. | `<div fyr-class="statusClass">` |
| `fyr-style` | Binds styles. | `<div fyr-style="cardStyle">` |
| `fyr-ref` | Stores an element reference. | `<input fyr-ref="searchInput">` |
| `fyr-init` | Runs a startup method for an element. | `<div fyr-init="load()">` |
| `fyr-cloak` | Hides content until Fyr is mounted. | `<div fyr-cloak>…</div>` |
| `fyr-transition` | Applies transition behavior. | `<aside fyr-transition="fade">…</aside>` |

See [directives.md](directives.md) for context and security guidance, and [todo](../examples/todo/) for the common list/form pattern.

## Optional bundles

| Import path | Provides | Notes |
| --- | --- | --- |
| `@aldane-dev-create/fyr/router` | `Router`, navigation helpers, history, guards, link directive | It matches/navigates but does not auto-render components. |
| `@aldane-dev-create/fyr/socket` | `SocketClient`, reconnection, heartbeat, channels | Your server owns authentication and message validation. |
| `@aldane-dev-create/fyr/ui` | `toast`, `modal`, `dialog`, `loading` | Add `@aldane-dev-create/fyr/ui.css` too. |
| `@aldane-dev-create/fyr/python` | Python runtime, Pyodide loader, worker/package/bridge primitives | Browser Python has a significant download and should use explicit limits. |
| `@aldane-dev-create/fyr/wasm` | Loader, registry, instances, memory and cache helpers | Restrict accepted module origins. |
| `@aldane-dev-create/fyr/fyr-engine.wasm` | Published Rust engine binary | Load through HTTP/CDN, never `file://`. |

## Registration APIs

`Fyr.controller`, `Fyr.component`, `Fyr.directive`, and `Fyr.plugin` register definitions. Component registration is available, but automatic component template rendering is not a stable feature yet; keep rendering application-owned. A registered plugin definition is likewise not an authorization boundary or a package manager.

~~~js
Fyr.directive("focus-on-ready", (element, expression) => {
  if (expression === "true") element.focus();
});

Fyr.on("assignment:submitted", assignment => {
  console.log("Submitted", assignment.id);
});
~~~

Use `Fyr.http` or `Fyr.action` for any server-changing action, then validate and authorize it on the server.
