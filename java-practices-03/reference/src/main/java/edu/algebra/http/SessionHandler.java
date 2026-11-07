package edu.algebra.http;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.util.List;
import java.util.Objects;

public final class SessionHandler implements HttpHandler {
    private static final String COOKIE = "J03SID";
    private static final String ATTRIBUTES = "; Path=/; HttpOnly; SameSite=Lax";
    private final SessionStore store;

    public SessionHandler(SessionStore store) {
        this.store = Objects.requireNonNull(store, "store");
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String candidate = candidateId(exchange.getRequestHeaders().get("Cookie"));
        if ("DELETE".equals(exchange.getRequestMethod())) {
            store.invalidate(candidate);
            exchange.getResponseHeaders().set("Set-Cookie", COOKIE + "=" + ATTRIBUTES + "; Max-Age=0");
            Responses.noBody(exchange, 204);
            return;
        }
        final SessionStore.Visit visit;
        try {
            visit = store.visit(candidate);
        } catch (SessionCapacityException full) {
            Responses.text(exchange, 503, "Session capacity reached\n");
            return;
        }
        // Store operations have returned: all HTTP I/O stays outside its monitor.
        if (visit.created()) {
            exchange.getResponseHeaders().set("Set-Cookie", COOKIE + "=" + visit.id() + ATTRIBUTES);
        }
        Responses.text(exchange, 200, "visits=" + visit.visits() + "\n");
    }

    static String candidateId(List<String> cookieHeaders) {
        String candidate = null;
        boolean seen = false;
        if (cookieHeaders == null) {
            return null;
        }
        for (String header : cookieHeaders) {
            for (String part : header.split(";", -1)) {
                String pair = part.strip();
                int equals = pair.indexOf('=');
                String name = equals < 0 ? pair : pair.substring(0, equals);
                if (!COOKIE.equals(name.strip())) {
                    continue;
                }
                if (seen || !COOKIE.equals(name) || equals < 0) {
                    return null;
                }
                seen = true;
                candidate = pair.substring(equals + 1);
                if (!SessionStore.isValidId(candidate)) {
                    return null;
                }
            }
        }
        return candidate;
    }
}
