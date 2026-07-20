import { Router } from "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-router.esm.js";

const pages = {
  home: ["Home", "The router matches the URL while this application decides how to render."],
  lessons: ["Lessons", "A route can represent any application state or screen."],
  profile: ["Student profile", "Dynamic route parameters are available on route.params."],
  private: ["Private area", "The guard allowed this demo route because the demo user is signed in."],
};
const router = new Router({
  mode: "hash",
  routes: [
    { path: "/", name: "home", component: "home" },
    { path: "/lessons", name: "lessons", component: "lessons" },
    { path: "/profile/:id", name: "profile", component: "profile" },
    { path: "/private", name: "private", component: "private", guards: [() => true] },
    { path: "*", name: "not-found", component: "home" },
  ],
});
router.onRouteChange(route => {
  const key = route?.route.component || "home";
  const [title, copy] = pages[key] || pages.home;
  document.querySelector("#route-path").textContent = `Matched: ${route?.path || "/"}`;
  document.querySelector("#route-title").textContent = title;
  document.querySelector("#route-copy").textContent = key === "profile" ? `${copy} Current id: ${route.params.id}.` : copy;
});
document.querySelectorAll("[data-route]").forEach(button => button.addEventListener("click", () => router.navigate(button.dataset.route)));
router.navigate(location.hash.slice(1) || "/", { replace: true });
