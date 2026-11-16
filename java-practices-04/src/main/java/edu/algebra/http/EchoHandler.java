package edu.algebra.http;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.io.InputStream;

public final class EchoHandler implements HttpHandler {
    static final int MAX_BODY_BYTES = 4096;

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        try (exchange; InputStream input = exchange.getRequestBody()) {
            byte[] body = readBounded(input);
            if (body.length > MAX_BODY_BYTES) {
                Responses.text(exchange, 413, "Payload too large\n");
            } else {
                Responses.bytes(exchange, 200, body);
            }
        }
    }

    /** Inspect one excess byte without trusting headers or collecting an unbounded body. */
    static byte[] readBounded(InputStream input) throws IOException {
        return input.readNBytes(MAX_BODY_BYTES + 1);
    }
}
