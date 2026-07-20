(function (global) {
  "use strict";

  const controllers = new Map();
  const plugins = new Map();
  const config = { apiBaseUrl: "", actionPath: "/_fyr/actions", credentials: "include" };
  const bound = new WeakSet();

  class FyrHttpError extends Error {
    constructor(message, status, data) {
      super(message);
      this.name = "FyrHttpError";
      this.status = status;
      this.data = data;
    }
  }

  const joinUrl = (base, path) => {
    if (/^https?:\/\//i.test(path)) return path;
    return `${String(base || "").replace(/\/$/, "")}/${String(path).replace(/^\//, "")}`;
  };

  const http = {
    async request(method, path, body, options = {}) {
      const headers = new Headers(options.headers || {});
      let payload = body;
      if (body !== undefined && !(body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
        payload = JSON.stringify(body);
      }
      const response = await fetch(joinUrl(config.apiBaseUrl, path), {
        method,
        body: payload,
        headers,
        credentials: options.credentials || config.credentials,
        signal: options.signal
      });
      const type = response.headers.get("content-type") || "";
      const data = type.includes("application/json") ? await response.json() : await response.text();
      if (!response.ok) {
        const message = data && typeof data === "object" ? (data.detail || data.message) : String(data || response.statusText);
        throw new FyrHttpError(message || "Request failed", response.status, data);
      }
      return data;
    },
    get: (path, options) => http.request("GET", path, undefined, options),
    post: (path, body, options) => http.request("POST", path, body, options),
    put: (path, body, options) => http.request("PUT", path, body, options),
    patch: (path, body, options) => http.request("PATCH", path, body, options),
    delete: (path, options) => http.request("DELETE", path, undefined, options)
  };

  function getPath(object, path) {
    return String(path).split(".").reduce((value, key) => value == null ? undefined : value[key], object);
  }

  function setPath(object, path, value) {
    const keys = String(path).split(".");
    const last = keys.pop();
    const target = keys.reduce((node, key) => node[key] ??= {}, object);
    target[last] = value;
  }

  function deepReactive(value, notify, cache = new WeakMap()) {
    if (!value || typeof value !== "object") return value;
    if (cache.has(value)) return cache.get(value);
    const proxy = new Proxy(value, {
      get(target, property, receiver) {
        return deepReactive(Reflect.get(target, property, receiver), notify, cache);
      },
      set(target, property, next, receiver) {
        const changed = Reflect.get(target, property, receiver) !== next;
        const result = Reflect.set(target, property, next, receiver);
        if (changed) notify();
        return result;
      },
      deleteProperty(target, property) {
        const result = Reflect.deleteProperty(target, property);
        notify();
        return result;
      }
    });
    cache.set(value, proxy);
    return proxy;
  }

  function evaluate(expression, scope, statement = false, extras = {}) {
    const names = [...Object.keys(scope), ...Object.keys(extras)];
    const values = [...Object.values(scope), ...Object.values(extras)];
    const body = `"use strict"; return (${expression});`;
    return Function(...names, body)(...values);
  }

  function renderLoop(template, scope) {
    const expression = template.getAttribute("fyr-for");
    const match = expression && expression.match(/^\s*([A-Za-z_$][\w$]*)\s+in\s+(.+)$/);
    if (!match) return;
    const [, itemName, collectionExpression] = match;
    const marker = template.__fyrMarker || document.createComment("fyr-for");
    if (!template.__fyrMarker) {
      template.__fyrMarker = marker;
      template.parentNode.insertBefore(marker, template.nextSibling);
    }
    (template.__fyrNodes || []).forEach(node => node.remove());
    const items = evaluate(collectionExpression, scope) || [];
    const nodes = [];
    [...items].forEach((item, index) => {
      const fragment = template.content.cloneNode(true);
      const localScope = Object.create(scope);
      localScope[itemName] = item;
      localScope.$index = index;
      const children = [...fragment.childNodes];
      marker.parentNode.insertBefore(fragment, marker);
      children.forEach(node => {
        nodes.push(node);
        if (node.nodeType === Node.ELEMENT_NODE) renderTree(node, localScope);
      });
    });
    template.__fyrNodes = nodes;
  }

  function bindEvent(element, attribute, eventName, scope) {
    if (bound.has(element) && element.__fyrEvents?.has(eventName)) return;
    element.__fyrEvents ||= new Set();
    element.__fyrEvents.add(eventName);
    bound.add(element);
    element.addEventListener(eventName, async event => {
      if (eventName === "submit") event.preventDefault();
      try {
        const result = evaluate(attribute.value, scope, true, { $event: event });
        if (result instanceof Promise) await result;
      } catch (error) {
        console.error("Fyr event error", error);
        Fyr.notify(error.message || "Action failed", "danger");
      }
    });
  }

  function renderTree(root, scope) {
    const elements = [root, ...root.querySelectorAll("*")];
    for (const element of elements) {
      if (!(element instanceof Element)) continue;
      if (element instanceof HTMLTemplateElement && element.hasAttribute("fyr-for")) {
        renderLoop(element, scope);
        continue;
      }
      const text = element.getAttribute("fyr-text");
      if (text) element.textContent = evaluate(text, scope) ?? "";
      const html = element.getAttribute("fyr-html");
      if (html) element.innerHTML = evaluate(html, scope) ?? "";
      const show = element.getAttribute("fyr-show");
      if (show) element.hidden = !evaluate(show, scope);
      const classExpr = element.getAttribute("fyr-class");
      if (classExpr) {
        const classes = evaluate(classExpr, scope) || {};
        Object.entries(classes).forEach(([name, enabled]) => element.classList.toggle(name, Boolean(enabled)));
      }
      [...element.attributes].forEach(attribute => {
        if (attribute.name.startsWith("fyr-bind:")) {
          const name = attribute.name.slice(9);
          const value = evaluate(attribute.value, scope);
          if (typeof value === "boolean") element.toggleAttribute(name, value);
          else if (value == null) element.removeAttribute(name);
          else element.setAttribute(name, String(value));
        }
      });
      const model = element.getAttribute("fyr-model");
      if (model && !element.__fyrModelBound) {
        element.__fyrModelBound = true;
        element.addEventListener("input", event => {
          const input = event.currentTarget;
          const value = input.type === "checkbox" ? input.checked : input.value;
          setPath(scope, model, value);
        });
      }
      if (model && "value" in element) {
        const value = getPath(scope, model);
        if (element.type === "checkbox") element.checked = Boolean(value);
        else if (element.value !== String(value ?? "")) element.value = value ?? "";
      }
      [...element.attributes].forEach(attribute => {
        if (attribute.name === "fyr-click") bindEvent(element, attribute, "click", scope);
        if (attribute.name === "fyr-submit") bindEvent(element, attribute, "submit", scope);
        if (attribute.name.startsWith("fyr-on:")) bindEvent(element, attribute, attribute.name.slice(7), scope);
      });
    }
  }

  function mount(root, definition) {
    let scheduled = false;
    const rerender = () => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        renderTree(root, scope);
      });
    };
    const state = deepReactive(structuredClone(definition.state || {}), rerender);
    const scope = state;
    scope.$root = root;
    scope.$http = http;
    scope.$action = Fyr.action;
    scope.$notify = Fyr.notify;
    Object.entries(definition.methods || {}).forEach(([name, method]) => scope[name] = method.bind(scope));
    root.__fyrScope = scope;
    renderTree(root, scope);
    Promise.resolve(definition.mounted?.call(scope)).catch(error => Fyr.notify(error.message, "danger"));
    return scope;
  }

  const Fyr = {
    version: "0.1.0",
    http,
    configure(options = {}) { Object.assign(config, options); return Fyr; },
    controller(name, definition) { controllers.set(name, definition); return Fyr; },
    plugin(name, plugin) { plugins.set(name, plugin); plugin.install?.(Fyr); return Fyr; },
    getPlugin(name) { return plugins.get(name); },
    async action(name, data = {}) {
      const response = await http.post(`${config.actionPath}/${encodeURIComponent(name)}`, { data });
      return response.data;
    },
    notify(message, type = "info", timeout = 3500) {
      let host = document.getElementById("fyr-toast-host");
      if (!host) {
        host = document.createElement("div");
        host.id = "fyr-toast-host";
        host.style.cssText = "position:fixed;right:1rem;bottom:1rem;z-index:99999;display:grid;gap:.5rem;max-width:min(420px,calc(100vw - 2rem))";
        document.body.appendChild(host);
      }
      const toast = document.createElement("div");
      toast.className = `fyr-toast fyr-toast-${type}`;
      toast.textContent = message;
      toast.style.cssText = "padding:.85rem 1rem;border-radius:.75rem;background:#111827;color:#fff;box-shadow:0 14px 35px rgba(0,0,0,.28);font:500 14px system-ui";
      host.appendChild(toast);
      setTimeout(() => toast.remove(), timeout);
    },
    async start(root = document) {
      root.querySelectorAll("[fyr-app]").forEach(element => {
        if (element.__fyrMounted) return;
        const name = element.getAttribute("fyr-controller") || element.getAttribute("fyr-app");
        const definition = controllers.get(name);
        if (!definition) return console.error(`Fyr controller '${name}' was not registered.`);
        element.__fyrMounted = true;
        mount(element, definition);
      });
    }
  };

  global.Fyr = Fyr;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => Fyr.start());
  else queueMicrotask(() => Fyr.start());
})(globalThis);
