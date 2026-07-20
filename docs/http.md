# HTTP client

Fyr.http is a fetch-based client with JSON request bodies, query parameters, retry support, timeouts, CSRF configuration, and request/response/error interceptors.

## Basic requests

~~~js
const response = await Fyr.http.get("/api/todos", {
  params: { status: "open", page: 1 }
});

if (!response.ok) {
  console.error(response.status, response.data);
  return;
}

console.log(response.data);
~~~

Available convenience methods are get, post, put, patch, delete, head, and options.

~~~js
const created = await Fyr.http.post("/api/todos", {
  title: "Write documentation"
});

const updated = await Fyr.http.patch("/api/todos/42", {
  completed: true
});
~~~

Responses expose data, status, statusText, headers, config, and ok. A non-2xx response resolves to a response object, so check response.ok when the status matters.

## Configure the client

~~~js
Fyr.http.setConfig({
  baseURL: "https://api.example.com",
  headers: {
    Authorization: "Bearer example-token"
  },
  credentials: "include",
  timeout: 10_000,
  retry: {
    retries: 2
  }
});
~~~

Relative request URLs are resolved against baseURL. Request bodies are sent as JSON and the client adds Content-Type: application/json unless overridden.

## Interceptors

Interceptors allow cross-cutting behavior such as authentication, response normalization, and centralized logging.

~~~js
Fyr.http.useRequestInterceptor(config => {
  return {
    ...config,
    headers: {
      ...config.headers,
      "X-Client-Version": "web"
    }
  };
});

Fyr.http.useResponseInterceptor(response => {
  console.log(response.status, response.config.url);
  return response;
});

Fyr.http.useErrorInterceptor(error => {
  console.error("Network request failed", error);
  return error;
});
~~~

Interceptors can be asynchronous. Error interceptors run only for thrown transport errors such as a timeout, aborted request, or network failure—not ordinary HTTP responses.

## CSRF

Configure CSRF explicitly when your backend requires it:

~~~js
Fyr.http.setConfig({
  csrf: {
    enabled: true,
    cookieName: "csrftoken",
    headerName: "X-CSRFToken"
  }
});
~~~

Your server remains responsible for validating the token and enforcing authorization. See [security.md](security.md) for the browser/server trust boundary.
