package edu.algebra.http;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReferenceArray;

import static org.junit.jupiter.api.Assertions.*;

@Timeout(20)
class AdmissionTest {
    private static HttpRequest request(int port) {
        return HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/work"))
                .timeout(Duration.ofSeconds(10)).GET().build();
    }

    @Test
    void twoHeldDelegatesRejectThirdBeforeReleaseAndRecoverWithoutExtraPermits() throws Exception {
        CountDownLatch holdersEntered = new CountDownLatch(2);
        CountDownLatch release = new CountDownLatch(1);
        AtomicInteger active = new AtomicInteger();
        AtomicInteger maximum = new AtomicInteger();
        AtomicInteger calls = new AtomicInteger();
        AtomicReferenceArray<Thread> holders = new AtomicReferenceArray<>(2);
        ServerConfig config = new ServerConfig(0, Duration.ofMinutes(30), 1000, 2);
        try (ServerApp server = ServerApp.start(config, exchange -> {
            int call = calls.incrementAndGet();
            if (call <= 2) holders.set(call - 1, Thread.currentThread());
            maximum.accumulateAndGet(active.incrementAndGet(), Math::max);
            holdersEntered.countDown();
            try {
                if (!release.await(8, TimeUnit.SECONDS)) throw new IOException("Test release timed out");
                Responses.text(exchange, 200, "accepted\n");
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                throw new IOException(interrupted);
            } finally {
                active.decrementAndGet();
            }
        }); HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build()) {
            try {
                var first = client.sendAsync(request(server.port()), HttpResponse.BodyHandlers.ofString());
                var second = client.sendAsync(request(server.port()), HttpResponse.BodyHandlers.ofString());
                assertTrue(holdersEntered.await(5, TimeUnit.SECONDS), "Both permits must be occupied before overload");
                assertEquals(2, active.get());
                var third = client.sendAsync(request(server.port()), HttpResponse.BodyHandlers.ofString());
                HttpResponse<String> busy = third.get(3, TimeUnit.SECONDS);
                assertEquals(503, busy.statusCode());
                assertEquals("Busy\n", busy.body());
                assertEquals("text/plain; charset=utf-8", busy.headers().firstValue("Content-Type").orElseThrow());
                assertEquals(1, release.getCount(), "Rejection completes before either holder is released");
                assertEquals(2, calls.get(), "Rejected request must never enter the delegate");
                assertEquals(2, maximum.get());
                // A rejected acquisition must not accidentally release a permit.
                HttpResponse<String> stillBusy = client.sendAsync(request(server.port()),
                        HttpResponse.BodyHandlers.ofString()).get(3, TimeUnit.SECONDS);
                assertEquals(503, stillBusy.statusCode());
                assertEquals(2, calls.get());
                release.countDown();
                assertEquals(200, first.get(5, TimeUnit.SECONDS).statusCode());
                assertEquals(200, second.get(5, TimeUnit.SECONDS).statusCode());
                // Receiving the body can precede AdmissionHandler's finally block.
                // Join the actual tasks so recovery begins after both releases.
                for (int i = 0; i < holders.length(); i++) {
                    Thread holder = holders.get(i);
                    assertNotNull(holder);
                    assertTrue(holder.isVirtual());
                    holder.join(1000);
                    assertFalse(holder.isAlive(), "Holder and its admission wrapper must finish");
                }
                HttpResponse<String> recovered = client.send(request(server.port()), HttpResponse.BodyHandlers.ofString());
                assertEquals(200, recovered.statusCode());
                assertEquals("accepted\n", recovered.body());
                assertEquals(3, calls.get());
                assertEquals(2, maximum.get());
            } finally {
                release.countDown();
            }
        }
    }
}
