# UI helpers

The optional UI bundle provides toast, modal, dialog, and loading helpers, plus its stylesheet.

## Include the stylesheet

~~~html
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/fyr-framework@0.1.0/dist/fyr-ui.css">
~~~

## Toasts from the core API

Fyr.notify is the toast function exported by the core runtime.

~~~js
Fyr.notify.success("Saved");
Fyr.notify.error("Unable to save");
Fyr.notify({
  message: "Uploading",
  type: "loading",
  duration: 0
});
~~~

Messages are rendered as text by default. The html toast option renders raw HTML, so use it only with trusted content.

## Import other helpers

~~~js
import { dialog, loading, modal } from "fyr-framework/ui";

const answer = await dialog.confirm("Delete this item?");
if (answer.confirmed) {
  await deleteItem();
}

const spinner = loading.show("Saving...");
await saveItem();
spinner.hide();
~~~

The ui bundle also has a direct CDN ESM entry at dist/fyr-ui.esm.js. Modal and dialog content can contain HTML; escape or sanitize any untrusted values before passing them in.
