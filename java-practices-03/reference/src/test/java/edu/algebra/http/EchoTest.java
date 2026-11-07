package edu.algebra.http;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

@Timeout(15)
class EchoTest {
    private ServerApp server;
    private HttpClient client;

    @BeforeEach
    void start() throws Exception {
        ServerConfig defaults = ServerConfig.defaults();
        server = ServerApp.start(new ServerConfig(0, defaults.sessionTtl(),
                defaults.sessionCapacity(), defaults.maxInFlight()));
        client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build();
    }

    @AfterEach
    void close() {
        try {
            if (client != null) client.close();
        } finally {
            if (server != null) server.close();
        }
    }

    private HttpResponse<byte[]> request(String method, String path, HttpRequest.BodyPublisher body)
            throws Exception {
        return client.send(HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + server.port() + path))
                        .timeout(Duration.ofSeconds(3)).method(method, body).build(),
                HttpResponse.BodyHandlers.ofByteArray());
    }

    static Stream<Arguments> acceptedBodies() {
        byte[] limit = new byte[4096];
        for (int i = 0; i < limit.length; i++) limit[i] = (byte) i;
        return Stream.of(new byte[0], "hello".getBytes(StandardCharsets.UTF_8),
                        new byte[]{0, 1, -1, -128, 13, 10},
                        "Željka 🌍\u0000".getBytes(StandardCharsets.UTF_8), limit)
                .map(body -> Arguments.of((Object) body));
    }

    @ParameterizedTest
    @MethodSource("acceptedBodies")
    void echoesOpaqueBytesIncludingEmptyAndExactLimit(byte[] body) throws Exception {
        assertEcho(request("POST", "/echo", HttpRequest.BodyPublishers.ofByteArray(body)), body);
    }

    private static void assertEcho(HttpResponse<byte[]> response, byte[] body) {
        assertAll(
                () -> assertEquals(200, response.statusCode()),
                () -> assertArrayEquals(body, response.body()),
                () -> assertEquals("application/octet-stream",
                        response.headers().firstValue("Content-Type").orElseThrow()),
                () -> assertTrue(response.headers().allValues("Set-Cookie").isEmpty()));
        if (body.length > 0) {
            assertEquals(Integer.toString(body.length),
                    response.headers().firstValue("Content-Length").orElseThrow());
        }
    }

    private void assertRejectedAndHealthStillWorks(HttpResponse<byte[]> response) throws Exception {
        assertEquals(413, response.statusCode(), "Oversize input must yield an actual HTTP response");
        assertArrayEquals("Payload too large\n".getBytes(StandardCharsets.UTF_8), response.body());
        assertEquals("text/plain; charset=utf-8", response.headers().firstValue("Content-Type").orElseThrow());
        HttpResponse<byte[]> health = request("GET", "/health", HttpRequest.BodyPublishers.noBody());
        assertEquals(200, health.statusCode());
        assertArrayEquals("OK\n".getBytes(StandardCharsets.UTF_8), health.body());
    }

    @Test
    void rejectsByte4097AndRemainsHealthy() throws Exception {
        assertRejectedAndHealthStillWorks(request("POST", "/echo",
                HttpRequest.BodyPublishers.ofByteArray(new byte[4097])));
    }

    @ParameterizedTest
    @ValueSource(ints = {17, 4096, 4097})
    void appliesSameLimitWhenPublisherDoesNotSupplyContentLength(int size) throws Exception {
        byte[] body = new byte[size];
        Arrays.fill(body, (byte) 0xAB);
        HttpRequest.BodyPublisher publisher = HttpRequest.BodyPublishers.ofInputStream(
                () -> new ByteArrayInputStream(body));
        assertEquals(-1, publisher.contentLength(), "Exercise chunked/unknown-length request input");
        HttpResponse<byte[]> response = request("POST", "/echo", publisher);
        if (size <= 4096) assertEcho(response, body);
        else assertRejectedAndHealthStillWorks(response);
    }

    @Test
    void boundedReaderNeverConsumesBeyondOneExcessByteFromAnUnboundedStream() throws Exception {
        class HostileStream extends InputStream {
            int consumed;

            @Override
            public int read() {
                if (consumed >= 4097) fail("Bounded reader attempted to consume byte 4098");
                consumed++;
                return 0xAB;
            }

            @Override
            public int available() {
                return Integer.MAX_VALUE;
            }
        }
        HostileStream input = new HostileStream();
        byte[] read = EchoHandler.readBounded(input);
        assertEquals(4097, input.consumed);
        assertEquals(4097, read.length);
        for (byte value : read) assertEquals((byte) 0xAB, value);
    }

    @Test
    void echoHasOnlyPostAndMatchesExactPath() throws Exception {
        HttpResponse<byte[]> wrongMethod = request("GET", "/echo", HttpRequest.BodyPublishers.noBody());
        assertEquals(405, wrongMethod.statusCode());
        assertEquals("POST", wrongMethod.headers().firstValue("Allow").orElseThrow());
        assertArrayEquals("Method not allowed\n".getBytes(StandardCharsets.UTF_8), wrongMethod.body());
        HttpResponse<byte[]> unknown = request("POST", "/echo/extra", HttpRequest.BodyPublishers.noBody());
        assertEquals(404, unknown.statusCode());
        assertArrayEquals("Not found\n".getBytes(StandardCharsets.UTF_8), unknown.body());
    }
}
