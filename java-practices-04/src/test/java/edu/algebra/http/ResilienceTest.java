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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

@Timeout(20)
class ResilienceTest {
    private static ServerConfig config(int port) {
        return new ServerConfig(port, Duration.ofMinutes(30), 1000, 1);
    }

    private static HttpRequest request(int port, String path) {
        return HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path))
                .timeout(Duration.ofSeconds(10)).GET().build();
    }

    private static void awaitFailedRequestTaskExit(AtomicReference<Thread> failedThread) throws InterruptedException {
        Thread task = failedThread.get();
        assertNotNull(task);
        assertTrue(task.isVirtual());
        // The response may arrive before the outer admission finally releases
        // its permit. Task termination establishes that the whole wrapper ended.
        task.join(1000);
        assertFalse(task.isAlive(), "Failed request and its admission wrapper must finish");
    }

    @Test
    void preHeaderFailureReturnsFixed500WithoutPartialHeadersAndReleasesPermit() throws Exception {
        String secret = "private-cookie-id-and-diagnostic";
        AtomicReference<Thread> failedThread = new AtomicReference<>();
        try (ServerApp server = ServerApp.start(config(0), exchange -> {
            if (exchange.getRequestURI().getPath().equals("/fail")) {
                failedThread.set(Thread.currentThread());
                exchange.getResponseHeaders().set("Set-Cookie", "J03SID=" + secret);
                exchange.getResponseHeaders().set("X-Debug", secret);
                throw new IllegalStateException(secret);
            }
            Responses.text(exchange, 200, "healthy\n");
        }); HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build()) {
            HttpResponse<String> failed = client.send(request(server.port(), "/fail"), HttpResponse.BodyHandlers.ofString());
            assertEquals(500, failed.statusCode());
            assertEquals("Internal server error\n", failed.body());
            assertFalse(failed.body().contains(secret));
            assertEquals("text/plain; charset=utf-8", failed.headers().firstValue("Content-Type").orElseThrow());
            assertEquals(Integer.toString(failed.body().getBytes(StandardCharsets.UTF_8).length),
                    failed.headers().firstValue("Content-Length").orElseThrow());
            assertTrue(failed.headers().allValues("Set-Cookie").isEmpty());
            assertTrue(failed.headers().allValues("X-Debug").isEmpty());
            awaitFailedRequestTaskExit(failedThread);
            HttpResponse<String> after = client.send(request(server.port(), "/after"), HttpResponse.BodyHandlers.ofString());
            assertEquals(200, after.statusCode(), "Cap-one permit must be released after a failed delegate");
            assertEquals("healthy\n", after.body());
        }
    }

    @Test
    void postHeaderFailureClosesTruncatedResponseWithoutSendingSecondStatus() throws Exception {
        AtomicReference<Thread> failedThread = new AtomicReference<>();
        try (ServerApp server = ServerApp.start(config(0), exchange -> {
            if (exchange.getRequestURI().getPath().equals("/started")) {
                failedThread.set(Thread.currentThread());
                exchange.sendResponseHeaders(200, 64);
                exchange.getResponseBody().write("partial".getBytes(StandardCharsets.UTF_8));
                exchange.getResponseBody().flush();
                throw new IllegalStateException("must-never-reach-client");
            }
            Responses.text(exchange, 200, "healthy\n");
        }); HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build()) {
            String raw;
            try (Socket socket = new Socket()) {
                socket.connect(new InetSocketAddress("127.0.0.1", server.port()), 2000);
                socket.setSoTimeout(3000);
                socket.getOutputStream().write(("GET /started HTTP/1.1\r\nHost: 127.0.0.1\r\n"
                        + "Connection: close\r\n\r\n").getBytes(StandardCharsets.US_ASCII));
                socket.getOutputStream().flush();
                raw = new String(socket.getInputStream().readAllBytes(), StandardCharsets.ISO_8859_1);
            }
            assertTrue(raw.startsWith("HTTP/1.1 200"));
            assertEquals(1, raw.split("HTTP/1\\.1 ", -1).length - 1);
            int headerEnd = raw.indexOf("\r\n\r\n");
            assertTrue(headerEnd > 0);
            String body = raw.substring(headerEnd + 4);
            assertEquals("partial", body);
            assertTrue(body.length() < 64, "Declared response length must remain incomplete after failure");
            assertFalse(raw.contains("500"));
            assertFalse(raw.contains("Internal server error"));
            assertFalse(raw.contains("must-never-reach-client"));
            awaitFailedRequestTaskExit(failedThread);
            HttpResponse<String> after = client.send(request(server.port(), "/after"), HttpResponse.BodyHandlers.ofString());
            assertEquals(200, after.statusCode());
            assertEquals("healthy\n", after.body());
        }
    }

    @Test
    void closeInterruptsHeldHandlerTerminatesWorkersAndReleasesListener() throws Exception {
        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        CountDownLatch exited = new CountDownLatch(1);
        AtomicReference<Thread> handlerThread = new AtomicReference<>();
        AtomicBoolean interrupted = new AtomicBoolean();
        try (ServerApp server = ServerApp.start(config(0), exchange -> {
            handlerThread.set(Thread.currentThread());
            entered.countDown();
            try {
                if (!release.await(15, TimeUnit.SECONDS)) throw new IOException("Test release timed out");
            } catch (InterruptedException expected) {
                interrupted.set(true);
                Thread.currentThread().interrupt();
                throw new IOException(expected);
            } finally {
                exited.countDown();
            }
        }); HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build()) {
            var pending = client.sendAsync(request(server.port(), "/held"), HttpResponse.BodyHandlers.ofString());
            try {
                assertTrue(entered.await(5, TimeUnit.SECONDS));
                assertTimeout(Duration.ofSeconds(4), server::close, "Shutdown must respect stop(1) plus await(2)");
                assertTrue(exited.await(1, TimeUnit.SECONDS), "Owned blocked handler must exit after interruption");
                assertTrue(interrupted.get(), "Forced shutdown must interrupt outstanding application work");
                Thread owned = handlerThread.get();
                assertNotNull(owned);
                owned.join(1000);
                assertFalse(owned.isAlive());
                assertTrue(server.workersTerminated(), "Green HTTP behavior alone does not prove executor cleanup");
                assertTimeout(Duration.ofSeconds(1), server::close);
                assertThrows(IOException.class, () -> {
                    try (Socket socket = new Socket()) {
                        socket.connect(new InetSocketAddress("127.0.0.1", server.port()), 1000);
                    }
                });
                ExecutionException failure = assertThrows(ExecutionException.class,
                        () -> pending.get(5, TimeUnit.SECONDS));
                assertInstanceOf(IOException.class, failure.getCause());
                try (ServerApp rebound = ServerApp.start(config(server.port()))) {
                    assertEquals(server.port(), rebound.port());
                }
            } finally {
                release.countDown();
                pending.cancel(true);
            }
        }
    }
}
