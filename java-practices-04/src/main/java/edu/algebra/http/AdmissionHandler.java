package edu.algebra.http;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.util.Objects;
import java.util.concurrent.Semaphore;

/** Bounds admitted application work; it does not cap sockets or virtual-thread creation. */
public final class AdmissionHandler implements HttpHandler {
    private final HttpHandler delegate;
    private final Semaphore permits;

    public AdmissionHandler(HttpHandler delegate, int maxInFlight) {
        this.delegate = Objects.requireNonNull(delegate, "delegate");
        if (maxInFlight < 1) {
            throw new IllegalArgumentException("Maximum in-flight requests must be positive");
        }
        permits = new Semaphore(maxInFlight);
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!permits.tryAcquire()) {
            Responses.text(exchange, 503, "Busy\n");
            return;
        }
        try {
            delegate.handle(exchange);
        } finally {
            // Only the successful acquisition owns a permit, even if the delegate fails.
            permits.release();
        }
    }
}
