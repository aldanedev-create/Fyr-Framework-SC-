# Server actions

Fyr.action is an ActionClient for backend operations that follow a common endpoint convention. Call it with Fyr.action.call; Fyr.action is not itself a function.

## Default protocol

~~~js
const result = await Fyr.action.call("todos.create", {
  title: "Write documentation"
});

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.status, result.code, result.error);
}
~~~

By default, this posts JSON to:

~~~
/_fyr/actions/todos.create
~~~

The JSON request body is shaped as:

~~~json
{
  "data": {
    "title": "Write documentation"
  }
}
~~~

Successful endpoints can return either a raw JSON value or an object containing data. In both cases, the client exposes the value as result.data.

## Configuration

~~~js
Fyr.action.setConfig({
  baseURL: "https://api.example.com",
  actionPath: "/actions",
  timeout: 15_000,
  retry: 1,
  cache: false
});
~~~

Configure the action client separately from Fyr.http. Actions include credentials by default; make sure that behavior matches your backend's cookie and CORS policy.

## Caching and invalidation

Opt into cache behavior per request:

~~~js
const stats = await Fyr.action.call(
  "dashboard.stats",
  {},
  { cache: { ttl: 30_000 } }
);

Fyr.action.invalidate("dashboard.stats");
~~~

Use caching only for responses that are safe to reuse. Mutating actions should normally disable caching and invalidate any dependent read actions after success.

## Error handling

Action calls resolve with a result object for HTTP and application failures. Reserve try/catch for unexpected client failures.

~~~js
try {
  const result = await Fyr.action.call("billing.charge", payload);
  if (!result.success) {
    Fyr.notify.error(result.error || "Charge failed");
  }
} catch (error) {
  Fyr.notify.error("Unable to reach the service");
}
~~~

Do not trust client-side action names or payloads as authorization. Every action endpoint must authenticate, authorize, and validate input on the server.
