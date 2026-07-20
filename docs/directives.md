# Directives

Directives are HTML attributes beginning with fyr-. Their expressions run in the current application or controller scope. Keep directive expressions small and put non-trivial work in controller methods.

| Directive | Purpose | Example |
| --- | --- | --- |
| fyr-text | Set escaped text content | fyr-text="user.name" |
| fyr-html | Set raw HTML; trusted content only | fyr-html="trustedMarkup" |
| fyr-model | Two-way form binding | fyr-model="email" |
| fyr-click | Run an expression on click | fyr-click="save()" |
| fyr-on:event | Handle a named DOM event | fyr-on:keyup.enter="search()" |
| fyr-submit | Handle a form submit and prevent navigation | fyr-submit="save()" |
| fyr-show | Toggle the hidden property | fyr-show="isOpen" |
| fyr-if | Conditionally render a template | fyr-if="isSignedIn" |
| fyr-for | Repeat a template for an array | fyr-for="item in items" |
| fyr-bind:name | Bind an HTML attribute | fyr-bind:disabled="saving" |
| fyr-class | Bind a class string, array, or object | fyr-class="{ active: selected }" |
| fyr-style | Bind inline style properties | fyr-style="{ color: color }" |
| fyr-ref | Store a DOM reference on controller.$refs | fyr-ref="searchInput" |
| fyr-init | Run once when scanned | fyr-init="load()" |
| fyr-cloak | Hide while Fyr compiles the element | fyr-cloak |
| fyr-controller | Mount a registered nested controller | fyr-controller="editor" |
| fyr-app | Identify an application root | fyr-app="dashboard" |
| fyr-transition | Add a transition to a visible element | fyr-transition="fade" |

## Text and HTML

fyr-text always assigns textContent, so the result is rendered as text.

~~~html
<p fyr-text="message"></p>
~~~

fyr-html assigns innerHTML. Use it only for HTML that has already been sanitized or authored by your application.

~~~html
<article fyr-html="trustedArticleHtml"></article>
~~~

## Events

Use fyr-click for buttons and fyr-on:event for other DOM events. Event expressions receive $event.

~~~html
<button fyr-click="remove(item.id)">Remove</button>
<input fyr-on:input="preview($event)">
<a href="/account" fyr-on:click.prevent="openAccount()">Account</a>
~~~

fyr-on supports the prevent, stop, self, and once modifiers. Modifiers are written after the event name, for example fyr-on:click.stop.

fyr-submit only applies to a form and always prevents the browser's native submission.

~~~html
<form fyr-submit="save()">
  <input fyr-model="title">
  <button>Save</button>
</form>
~~~

## Forms

fyr-model supports input, textarea, and select elements. Checkboxes bind booleans, and radio inputs bind their value.

~~~html
<input type="text" fyr-model="user.name">
<input type="checkbox" fyr-model="settings.newsletter">
<textarea fyr-model="notes"></textarea>
<select fyr-model="status">
  <option value="open">Open</option>
  <option value="done">Done</option>
</select>
~~~

The expression must be a writable state path. Do not bind fyr-model to a computed value or method.

## Conditional content and lists

fyr-show leaves an element in the DOM and toggles its hidden property.

~~~html
<aside fyr-show="menuOpen">Menu</aside>
~~~

fyr-if and fyr-for operate on template elements. Use fyr-show when preserving form state or DOM position matters; use a template for content that should be created conditionally or repeated.

~~~html
<template fyr-if="isSignedIn">
  <p>Welcome back.</p>
</template>

<template fyr-for="item in items" fyr-key="item.id">
  <li>
    <span fyr-text="item.label"></span>
    <small fyr-text="$index"></small>
  </li>
</template>
~~~

fyr-for currently iterates arrays. Add fyr-key for stable list items when array contents can be reordered.

## Attributes, classes, and styles

~~~html
<button fyr-bind:disabled="saving">Save</button>
<img fyr-bind:src="avatarUrl" fyr-bind:alt="user.name">
<nav fyr-class="{ expanded: menuOpen, compact: !menuOpen }"></nav>
<p fyr-style="{ color: statusColor, fontSize: size + 'px' }"></p>
~~~

Boolean attributes are present when their expression is truthy and removed when it is falsy. Null and undefined remove an ordinary bound attribute.

## References and initialization

~~~html
<input fyr-ref="search" fyr-init="focusSearch()">
~~~

The reference is available as this.$refs.search inside controller methods. fyr-init runs once per element scan; use it for local setup, not for rendering state.

## Avoiding a flash before startup

Add a small global rule for elements marked fyr-cloak:

~~~html
<style>[fyr-cloak] { display: none; }</style>
<main fyr-app="app" fyr-cloak>...</main>
~~~

Fyr removes the temporary inline hiding after compilation.
