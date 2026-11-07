package edu.algebra.http;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.util.Objects;

/** Contains application runtime failures without promising replacement after headers start. */
public final class ErrorBoundary implements HttpHandler {
    private final HttpHandler delegate;

    public ErrorBoundary(HttpHandler delegate) {
        this.delegate = Objects.requireNonNull(delegate, "delegate");
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        try (exchange) {
            try {
                delegate.handle(exchange);
            } catch (RuntimeException failure) {
                if (exchange.getResponseCode() == -1) {
                    // Discard any partial application headers, including uncommitted cookies.
                    exchange.getResponseHeaders().clear();
                    Responses.text(exchange, 500, "Internal server error\n");
                }
                // A started response cannot be replaced. Closing the exchange terminates it.
            }
        }
    }
}
