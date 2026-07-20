# UI helpers

The optional UI bundle provides toast, modal, dialog, and loading helpers, plus its stylesheet.

## Include the stylesheet

~~~html
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-ui.css">
~~~

## Toasts from the core API

Fyr.notify is the toast function exported by the core runtime.

~~~html
<script type="module">
  import { Fyr } from
    "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr.esm.js";

  Fyr.notify.success("Saved");
  Fyr.notify.error("Unable to save");
  Fyr.notify({ message: "Uploading", type: "loading", duration: 0 });
</script>
~~~

Messages are rendered as text by default. The html toast option renders raw HTML, so use it only with trusted content.

## Import other helpers

~~~html
<script type="module">
  import { dialog, loading, modal } from
    "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-ui.esm.js";

const answer = await dialog.confirm("Delete this item?");
if (answer.confirmed) {
  await deleteItem();
}

const spinner = loading.show("Saving...");
await saveItem();
spinner.hide();
</script>
~~~

Calling `modal(options)` creates a modal instance; call `.open()` to display it. Modal and dialog content can contain HTML, so escape or sanitize any untrusted values before passing them in. See [CDN usage](cdn.md#ui-helpers) for a complete toast and modal example.
