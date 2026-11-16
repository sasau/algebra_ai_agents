package edu.algebra.http;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;

/** JDK contexts match prefixes; this root handler deliberately matches complete paths. */
public final class Router implements HttpHandler {
    private final GreetingHandler greeting = new GreetingHandler();
    private final EchoHandler echo = new EchoHandler();
    private final SessionHandler session;

    public Router(SessionStore store) {
        session = new SessionHandler(store);
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String path = exchange.getRequestURI().getPath();
        String allowed = switch (path) {
            case "/health", "/hello" -> "GET";
            case "/echo" -> "POST";
            case "/session" -> "GET, DELETE";
            default -> null;
        };
        if (allowed == null) {
            Responses.text(exchange, 404, "Not found\n");
            return;
        }
        String method = exchange.getRequestMethod();
        boolean supported = "/session".equals(path)
                ? "GET".equals(method) || "DELETE".equals(method)
                : allowed.equals(method);
        if (!supported) {
            exchange.getResponseHeaders().set("Allow", allowed);
            Responses.text(exchange, 405, "Method not allowed\n");
            return;
        }
        switch (path) {
            case "/health" -> Responses.text(exchange, 200, "OK\n");
            case "/hello" -> greeting.handle(exchange);
            case "/echo" -> echo.handle(exchange);
            case "/session" -> session.handle(exchange);
            default -> throw new AssertionError("Unreachable route");
        }
    }
}
