package edu.algebra.http;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

@Timeout(15)
class ServerLifecycleTest {
    private static ServerConfig config(int port) {
        ServerConfig defaults = ServerConfig.defaults();
        return new ServerConfig(port, defaults.sessionTtl(), defaults.sessionCapacity(), defaults.maxInFlight());
    }

    private static void assertHealth(HttpClient client, int port) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/health"))
                .timeout(Duration.ofSeconds(3)).GET().build();
        HttpResponse<byte[]> response = client.send(request, HttpResponse.BodyHandlers.ofByteArray());
        assertAll(
                () -> assertEquals(200, response.statusCode()),
                () -> assertArrayEquals("OK\n".getBytes(StandardCharsets.UTF_8), response.body()),
                () -> assertEquals("text/plain; charset=utf-8",
                        response.headers().firstValue("Content-Type").orElseThrow()),
                () -> assertEquals("3", response.headers().firstValue("Content-Length").orElseThrow()),
                () -> assertTrue(response.headers().allValues("Set-Cookie").isEmpty()));
    }

    @Test
    void actualHealthRequestCloseTwiceAndRebindReleasedPort() throws Exception {
        try (HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build()) {
            int port;
            try (ServerApp server = ServerApp.start(config(0))) {
                port = server.port();
                assertTrue(port > 0 && port <= 65535, "Port 0 must resolve to an actual listener port");
                assertHealth(client, port);
                assertTimeout(Duration.ofSeconds(4), server::close);
                assertTimeout(Duration.ofSeconds(1), server::close);
                assertTrue(server.workersTerminated(), "An idle owned executor must terminate on close");
                assertThrows(IOException.class, () -> {
                    try (Socket socket = new Socket()) {
                        socket.connect(new InetSocketAddress("127.0.0.1", port), 1000);
                    }
                }, "Closed listener must no longer accept a new connection");
            }
            try (ServerApp rebound = ServerApp.start(config(port))) {
                assertEquals(port, rebound.port());
                assertHealth(client, rebound.port());
            }
        }
    }

    @Test
    void occupiedPortStartupFailsWithoutDisruptingExistingServer() throws Exception {
        try (ServerApp server = ServerApp.start(config(0));
             HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build()) {
            assertThrows(IOException.class, () -> ServerApp.start(config(server.port())));
            assertHealth(client, server.port());
        }
    }
}
