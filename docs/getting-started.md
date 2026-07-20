# Getting started
# fyr.js website: https://fyrjsorg.vercel.app/

## 1. Mark an application root

Use fyr-app to identify the DOM root. Its value is the application name.

~~~html
<main fyr-app="todo">
  <h1 fyr-text="title"></h1>
  <input fyr-model="draft" fyr-on:keyup.enter="add()">
  <button fyr-click="add()">Add</button>

  <template fyr-for="item in items" fyr-key="item.id">
    <article>
      <span fyr-text="item.text"></span>
      <button fyr-click="remove(item.id)">Remove</button>
    </article>
  </template>
</main>
~~~

## 2. Create and mount the app

Create the app after the Fyr script has loaded, then mount it by name. Applications are not mounted merely by calling Fyr.createApp.

~~~js
Fyr.createApp("todo", {
  state: {
    title: "Tasks",
    draft: "",
    items: []
  },

  methods: {
    add() {
      const text = this.state.draft.trim();
      if (!text) return;

      this.state.items.push({
        id: crypto.randomUUID(),
        text
      });
      this.state.draft = "";
    },

    remove(id) {
      this.state.items = this.state.items.filter(item => item.id !== id);
    }
  }
});

Fyr.start("todo");
~~~

Fyr.start accepts an application name, a selector, an element, or document. In normal application code, using the name avoids ambiguity.

## How binding scopes work

Inside an application, directives can read:

- properties in state, such as title or items
- computed values, such as remaining
- methods, such as add()
- loop values, such as item and $index
- event handlers' $event value

Methods are bound to their controller instance. Read and write state through this.state in a method:

~~~js
increment() {
  this.state.count += 1;
}
~~~

## Multiple applications

You can mount independent application roots on one page as long as their names are unique.

~~~html
<section fyr-app="search"></section>
<aside fyr-app="cart"></aside>
~~~

~~~js
Fyr.createApp("search", { state: { query: "" } });
Fyr.createApp("cart", { state: { items: [] } });
Fyr.start(document);
~~~

## Next steps

Read [controllers.md](controllers.md) for application structure, then [directives.md](directives.md) for the complete template syntax.
