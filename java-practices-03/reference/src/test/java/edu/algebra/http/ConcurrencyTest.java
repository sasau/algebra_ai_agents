package edu.algebra.http;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.LongStream;

import static org.junit.jupiter.api.Assertions.*;

@Timeout(25)
class ConcurrencyTest {
    private static ServerConfig config() {
        return new ServerConfig(0, Duration.ofMinutes(30), 1000, 32);
    }

    private static HttpRequest request(int port, String path, String cookie) {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path))
                .timeout(Duration.ofSeconds(10)).GET();
        if (cookie != null) builder.header("Cookie", cookie);
        return builder.build();
    }

    @Test
    void secondHandlerEntersAndCompletesBeforeFirstIsReleased() throws Exception {
        CountDownLatch firstEntered = new CountDownLatch(1);
        CountDownLatch secondEntered = new CountDownLatch(1);
        CountDownLatch releaseFirst = new CountDownLatch(1);
        AtomicInteger active = new AtomicInteger();
        AtomicInteger maximum = new AtomicInteger();
        AtomicBoolean allVirtual = new AtomicBoolean(true);
        try (ServerApp server = ServerApp.start(config(), exchange -> {
            if (!Thread.currentThread().isVirtual()) allVirtual.set(false);
            maximum.accumulateAndGet(active.incrementAndGet(), Math::max);
            try {
                if (exchange.getRequestURI().getPath().equals("/first")) {
                    firstEntered.countDown();
                    if (!releaseFirst.await(8, TimeUnit.SECONDS)) throw new IOException("Test release timed out");
                } else {
                    secondEntered.countDown();
                }
                Responses.text(exchange, 200, "done\n");
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                throw new IOException(interrupted);
            } finally {
                active.decrementAndGet();
            }
        }); HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build()) {
            try {
                var first = client.sendAsync(request(server.port(), "/first", null), HttpResponse.BodyHandlers.ofString());
                assertTrue(firstEntered.await(5, TimeUnit.SECONDS));
                var second = client.sendAsync(request(server.port(), "/second", null), HttpResponse.BodyHandlers.ofString());
                assertTrue(secondEntered.await(5, TimeUnit.SECONDS), "Second handler must enter while first is waiting");
                HttpResponse<String> secondResponse = second.get(5, TimeUnit.SECONDS);
                assertEquals(200, secondResponse.statusCode());
                assertEquals("done\n", secondResponse.body());
                assertEquals(1, releaseFirst.getCount(), "First handler has not been released");
                assertFalse(first.isDone(), "First handler remains in flight while second completes");
                assertEquals(2, maximum.get());
                assertTrue(allVirtual.get(), "Both real request handlers must execute on virtual threads");
                releaseFirst.countDown();
                assertEquals(200, first.get(5, TimeUnit.SECONDS).statusCode());
            } finally {
                releaseFirst.countDown();
            }
        }
    }

    @Test
    void fixedCookieHasExactlyTwoHundredAtomicVisitsAndOtherCookieIsUnaffected() throws Exception {
        ExecutorService clients = Executors.newFixedThreadPool(10);
        CountDownLatch ready = new CountDownLatch(10);
        CountDownLatch start = new CountDownLatch(1);
        try (ServerApp server = ServerApp.start(config());
             HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build()) {
            try {
                HttpResponse<String> seed = client.send(request(server.port(), "/session", null), HttpResponse.BodyHandlers.ofString());
                assertEquals(200, seed.statusCode());
                assertEquals("visits=1\n", seed.body());
                String fixedCookie = seed.headers().firstValue("Set-Cookie").orElseThrow().split(";", 2)[0];
                HttpResponse<String> other = client.send(request(server.port(), "/session", null), HttpResponse.BodyHandlers.ofString());
                assertEquals("visits=1\n", other.body());
                String otherCookie = other.headers().firstValue("Set-Cookie").orElseThrow().split(";", 2)[0];
                assertNotEquals(fixedCookie, otherCookie);
                List<Future<HttpResponse<String>>> futures = new ArrayList<>();
                for (int i = 0; i < 200; i++) {
                    futures.add(clients.submit(() -> {
                        ready.countDown();
                        assertTrue(start.await(5, TimeUnit.SECONDS));
                        return client.send(request(server.port(), "/session", fixedCookie), HttpResponse.BodyHandlers.ofString());
                    }));
                }
                assertTrue(ready.await(5, TimeUnit.SECONDS));
                start.countDown();
                Set<Long> counts = new HashSet<>();
                for (Future<HttpResponse<String>> future : futures) {
                    HttpResponse<String> response = future.get(10, TimeUnit.SECONDS);
                    assertEquals(200, response.statusCode());
                    assertTrue(response.body().matches("visits=[0-9]+\n"));
                    assertTrue(response.headers().allValues("Set-Cookie").isEmpty());
                    long count = Long.parseLong(response.body().substring(7).strip());
                    assertTrue(counts.add(count), "Each successful request must return a unique count");
                }
                assertEquals(LongStream.rangeClosed(2, 201).boxed().collect(Collectors.toSet()), counts);
                HttpResponse<String> inspection = client.send(request(server.port(), "/session", fixedCookie), HttpResponse.BodyHandlers.ofString());
                assertEquals(200, inspection.statusCode());
                assertEquals("visits=202\n", inspection.body());
                HttpResponse<String> independent = client.send(request(server.port(), "/session", otherCookie), HttpResponse.BodyHandlers.ofString());
                assertEquals(200, independent.statusCode());
                assertEquals("visits=2\n", independent.body());
            } finally {
                start.countDown();
                clients.shutdownNow();
                assertTrue(clients.awaitTermination(5, TimeUnit.SECONDS));
            }
        } finally {
            start.countDown();
            clients.shutdownNow();
            assertTrue(clients.awaitTermination(5, TimeUnit.SECONDS));
        }
    }
}
