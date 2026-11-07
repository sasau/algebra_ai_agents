package edu.algebra.http;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/** Owns the response body and exchange, including exceptional write paths. */
public final class Responses {
    private Responses() { }

    public static void text(HttpExchange exchange, int status, String text) throws IOException {
        write(exchange, status, text.getBytes(StandardCharsets.UTF_8), "text/plain; charset=utf-8");
    }

    public static void bytes(HttpExchange exchange, int status, byte[] bytes) throws IOException {
        write(exchange, status, bytes, "application/octet-stream");
    }

    public static void noBody(HttpExchange exchange, int status) throws IOException {
        try (exchange) {
            exchange.sendResponseHeaders(status, -1);
        }
    }

    private static void write(HttpExchange exchange, int status, byte[] bytes, String contentType)
            throws IOException {
        try (exchange) {
            exchange.getResponseHeaders().set("Content-Type", contentType);
            if ("HEAD".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(status, -1);
            } else {
                exchange.sendResponseHeaders(status, bytes.length);
                try (var output = exchange.getResponseBody()) {
                    output.write(bytes);
                }
            }
        }
    }
}
