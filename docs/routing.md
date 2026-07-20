# Routing

The optional router bundle provides path matching, hash or history navigation, route guards, and route-change events. It does not render a route's component for you; application code should listen for a route change and decide how to update the UI.

## Create a router

~~~html
<script type="module">
  import { Router } from
  "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-router.esm.js";

  const router = new Router({
    mode: "hash",
    routes: [
      { path: "/", name: "home", component: "home-page" },
      { path: "/users/:id", name: "user", component: "user-page" },
      { path: "*", component: "not-found" }
    ]
  });

  router.onRouteChange(route => {
    document.querySelector("#route-name").textContent =
      route ? route.route.component : "not-found";
  });

  await router.navigate("/users/42");
</script>
~~~

Routes may include path, component, name, guards, children, redirect, meta, and lazy values. A lazy function is invoked after a route is selected.

## Guard navigation

~~~js
const router = new Router({
  routes: [
    {
      path: "/admin",
      component: "admin-page",
      guards: [
        () => currentUser.isAdmin
      ]
    }
  ],
  guards: [
    async (to, from) => !to.path.startsWith("/private") || currentUser.isSignedIn
  ]
});
~~~

A guard that returns false blocks navigation. Client-side guards improve user experience but never replace server-side authorization.

## History mode

Use hash mode for simple static hosting. For history mode, configure the host to return the application HTML for client-side route URLs; see [deployment.md](deployment.md).

## Current limitations

The router is usable as a navigation and matching utility, but there is no automatic component renderer. Treat router integration as application-owned plumbing and cover it with browser tests.
