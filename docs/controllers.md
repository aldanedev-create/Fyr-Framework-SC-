# Controllers and reactive state

An application created by Fyr.createApp has a controller instance. State is reactive: changes made through its proxy update bindings that depend on those properties.

## Application options

~~~js
Fyr.createApp("profile", {
  el: '[fyr-app="profile"]',
  state: {
    firstName: "Ada",
    lastName: "Lovelace",
    visits: 0
  },

  methods: {
    visit() {
      this.state.visits += 1;
    }
  },

  computed: {
    fullName() {
      return this.state.firstName + " " + this.state.lastName;
    }
  },

  watch: {
    visits(next, previous) {
      console.log({ next, previous });
    }
  },

  mounted() {
    console.log("Profile mounted");
  },

  beforeDestroy() {
    console.log("Profile will be destroyed");
  },

  destroyed() {
    console.log("Profile destroyed");
  }
});
~~~

The el option defaults to the selector [fyr-app="application-name"]. Fyr.createApp returns the app instance, and Fyr.destroyApp(name) tears down a mounted app.

## State

Use plain objects and arrays for state. Nested objects are proxied when accessed, so ordinary assignments remain reactive.

~~~js
this.state.user.name = "Grace";
this.state.items.push({ id: 3, done: false });
this.state.filters = { status: "open" };
~~~

Do not mutate the original object passed as state after app creation. Use the controller's this.state instead.

## Methods

Template methods are called by name. Fyr binds each method to its controller instance, so this.state is safe to use even when the method is invoked from a directive.

~~~html
<button fyr-click="save()">Save</button>
<form fyr-submit="save()"></form>
~~~

## Computed values

Computed values are exposed to templates by name and are read-only there.

~~~js
computed: {
  remaining() {
    return this.state.items.filter(item => !item.done).length;
  }
}
~~~

~~~html
<p fyr-text="remaining"></p>
~~~

## Watchers

Use watch keys for side effects such as persistence, analytics, or controlled API calls.

~~~js
watch: {
  query(next) {
    localStorage.setItem("last-query", next);
  }
}
~~~

Watch callbacks receive the next and previous values and run with the controller as this.

## Nested controllers

Register a named controller with Fyr.controller, then use fyr-controller inside an already-rendered Fyr application. This is useful for self-contained areas of a larger app.

~~~js
Fyr.controller("counter", {
  state: { count: 0 },
  methods: {
    increment() {
      this.state.count += 1;
    }
  }
});
~~~

~~~html
<section fyr-controller="counter">
  <span fyr-text="count"></span>
  <button fyr-click="increment()">Increment</button>
</section>
~~~

The containing Fyr application must still be created and mounted so the directive scanner can instantiate the nested controller.
