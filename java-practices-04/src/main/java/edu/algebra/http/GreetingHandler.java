package edu.algebra.http;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;

public final class GreetingHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        final String name;
        try {
            name = nameFromQuery(exchange.getRequestURI().getRawQuery());
        } catch (IllegalArgumentException e) {
            Responses.text(exchange, 400, "Bad request\n");
            return;
        }
        Responses.text(exchange, 200, "Hello, " + name + "!\n");
    }

    private static String nameFromQuery(String rawQuery) {
        String name = null;
        if (rawQuery != null) {
            for (String pair : rawQuery.split("&", -1)) {
                int equals = pair.indexOf('=');
                String key = decode(equals < 0 ? pair : pair.substring(0, equals));
                String value = decode(equals < 0 ? "" : pair.substring(equals + 1));
                if ("name".equals(key)) {
                    if (name != null || value.isBlank() || value.codePointCount(0, value.length()) > 80) {
                        throw new IllegalArgumentException("Invalid name");
                    }
                    name = value;
                }
            }
        }
        return name == null ? "world" : name;
    }

    /** Form-style decoding with strict UTF-8, including ignored parameters. */
    private static String decode(String raw) {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        for (int i = 0; i < raw.length();) {
            char current = raw.charAt(i);
            if (current == '%') {
                if (i + 2 >= raw.length()) {
                    throw new IllegalArgumentException("Incomplete percent escape");
                }
                int high = Character.digit(raw.charAt(i + 1), 16);
                int low = Character.digit(raw.charAt(i + 2), 16);
                if (high < 0 || low < 0) {
                    throw new IllegalArgumentException("Invalid percent escape");
                }
                bytes.write((high << 4) | low);
                i += 3;
            } else if (current == '+') {
                bytes.write(' ');
                i++;
            } else {
                int next = i + Character.charCount(raw.codePointAt(i));
                bytes.writeBytes(raw.substring(i, next).getBytes(StandardCharsets.UTF_8));
                i = next;
            }
        }
        try {
            return StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes.toByteArray())).toString();
        } catch (CharacterCodingException e) {
            throw new IllegalArgumentException("Invalid UTF-8", e);
        }
    }
}
