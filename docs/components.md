# Components

Fyr contains component definitions, props, slots, and component-instance utilities, but the core DOM renderer does not yet provide a stable declarative component mounting syntax.

## Register a definition

You can register metadata and a template with Fyr.component:

~~~js
Fyr.component("user-card", {
  props: {
    name: String
  },
  template: "<article><h2>User</h2></article>"
});
~~~

Component names must be unique. The lower-level core package also includes defineComponent and registry helpers.

## Current limitation

In the 0.1.0 runtime, registering a component does not make a custom HTML tag automatically render. Keep production UI composition in regular Fyr application templates and nested controllers until component mounting is released as a documented, tested API.

This guide intentionally documents the boundary rather than a speculative syntax. Components are planned as a future stable feature; check the [roadmap](../ROADMAP.md) before designing a public component library around the prototype API.
