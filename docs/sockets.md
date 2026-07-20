# WebSockets

The optional socket bundle contains SocketClient with reconnect, heartbeat, channel, and message-queue support.

## Connect and listen

~~~html
<script type="module">
  import { SocketClient } from
    "https://cdn.jsdelivr.net/npm/fyr-framework@0.1.0/dist/fyr-socket.esm.js";

  const socket = new SocketClient({
    url: "wss://api.example.com/events",
    reconnect: { maxAttempts: 5 },
    heartbeat: { interval: 30_000 }
  });

  socket.on("message", event => {
    console.log(event.data);
  });

  await socket.connect();
  socket.send({ type: "ping" });
</script>
~~~

Messages passed to send are JSON-encoded unless they are already strings. Messages sent before a connection succeeds are queued.

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
