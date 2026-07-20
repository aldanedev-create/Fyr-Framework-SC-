# WebSockets

The optional socket bundle contains SocketClient with reconnect, heartbeat, channel, and message-queue support.

## Connect and listen

~~~html
<script type="module">
  import { SocketClient } from
  "https://cdn.jsdelivr.net/npm/@aldane-dev-create/fyr@0.1.2/dist/fyr-socket.esm.js";

  const socket = new SocketClient({
    url: "wss://api.example.com/events",
    reconnect: { maxAttempts: 5 },
    heartbeat: { enabled: false }
  });

  socket.on("message", event => {
    console.log(event.data);
  });

  await socket.connect();
  socket.send({ type: "ping" });
</script>
~~~

Messages passed to send are JSON-encoded unless they are already strings. Messages sent before a connection succeeds are queued.

In 0.1.2, disable the built-in heartbeat. The current implementation tracks incoming messages but does not send the configured ping payload through SocketClient yet. See [CDN usage](cdn.md#websockets) for the complete CDN example.

## Channels

The client uses a small JSON convention for channels:

~~~js
const unsubscribe = socket.subscribe("orders", data => {
  console.log("Order update", data);
});

socket.publish("orders", { type: "refresh" });
unsubscribe();
~~~

Your server must implement matching subscribe, unsubscribe, and publish message handling. WebSockets authenticate at the server; never assume a channel name authorizes access to its data.
