package edu.algebra.http;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

@Timeout(20)
class LoadProbeTest {
    private record Result(int exit, String out, String err) { }

    private static ServerConfig config() {
        return new ServerConfig(0, Duration.ofMinutes(30), 1000, 32);
    }

    private static String origin(int port) {
        return "http://127.0.0.1:" + port;
    }

    private static Result run(String[] args, Duration requestTimeout, Duration overallTimeout) {
        ByteArrayOutputStream stdout = new ByteArrayOutputStream();
        ByteArrayOutputStream stderr = new ByteArrayOutputStream();
        try (PrintStream out = new PrintStream(stdout, true, StandardCharsets.UTF_8);
             PrintStream err = new PrintStream(stderr, true, StandardCharsets.UTF_8)) {
            int exit = LoadProbe.run(args, out, err, requestTimeout, overallTimeout);
            return new Result(exit, stdout.toString(StandardCharsets.UTF_8), stderr.toString(StandardCharsets.UTF_8));
        }
    }

    private static void assertMetrics(Result result, int requests, int concurrency, int successes, int failures) {
        Matcher metrics = Pattern.compile("requests=(\\d+) concurrency=(\\d+) successes=(\\d+) failures=(\\d+) "
                        + "elapsed_seconds=([0-9.]+) successful_requests_per_second=([0-9.]+)\\R?")
                .matcher(result.out());
        assertTrue(metrics.matches(), result.out());
        assertEquals(requests, Integer.parseInt(metrics.group(1)));
        assertEquals(concurrency, Integer.parseInt(metrics.group(2)));
        assertEquals(successes, Integer.parseInt(metrics.group(3)));
        assertEquals(failures, Integer.parseInt(metrics.group(4)));
        double elapsed = Double.parseDouble(metrics.group(5));
        double rate = Double.parseDouble(metrics.group(6));
        assertTrue(Double.isFinite(elapsed) && elapsed > 0);
        assertTrue(Double.isFinite(rate) && rate >= 0);
        if (successes > 0) assertTrue(rate > 0);
        else assertEquals(0.0, rate);
    }

    private static void shutdown(ExecutorService executor) throws InterruptedException {
        executor.shutdownNow();
        assertTrue(executor.awaitTermination(5, TimeUnit.SECONDS));
    }

    @Test
    void sendsExactlyNCorrectHealthRequestsWithAtMostCOverlappingWorkers() throws Exception {
        int count = 12;
        int concurrency = 3;
        CountDownLatch firstWave = new CountDownLatch(concurrency);
        CountDownLatch release = new CountDownLatch(1);
        AtomicInteger calls = new AtomicInteger();
        AtomicInteger active = new AtomicInteger();
        AtomicInteger maximum = new AtomicInteger();
        AtomicBoolean exactRoute = new AtomicBoolean(true);
        ExecutorService runner = Executors.newSingleThreadExecutor();
        try (ServerApp server = ServerApp.start(config(), exchange -> {
            calls.incrementAndGet();
            maximum.accumulateAndGet(active.incrementAndGet(), Math::max);
            if (!"GET".equals(exchange.getRequestMethod()) || !"/health".equals(exchange.getRequestURI().getPath())) {
                exactRoute.set(false);
            }
            firstWave.countDown();
            try {
                if (!release.await(8, TimeUnit.SECONDS)) throw new IOException("Test release timed out");
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                throw new IOException(interrupted);
            } finally {
                // End held application work before publishing a response: a client
                // can start its next request before this handler's trailing cleanup.
                active.decrementAndGet();
            }
            Responses.text(exchange, 200, "OK\n");
        })) {
            try {
                Future<Result> result = runner.submit(() -> run(new String[]{origin(server.port()), "12", "3"},
                        Duration.ofSeconds(10), Duration.ofSeconds(15)));
                assertTrue(firstWave.await(5, TimeUnit.SECONDS));
                assertEquals(concurrency, active.get());
                assertEquals(concurrency, calls.get(), "Only C request workers may be awaiting held responses");
                release.countDown();
                Result completed = result.get(10, TimeUnit.SECONDS);
                assertEquals(0, completed.exit());
                assertEquals("", completed.err());
                assertMetrics(completed, count, concurrency, count, 0);
                assertEquals(count, calls.get());
                assertTrue(exactRoute.get());
                assertTrue(maximum.get() <= concurrency);
            } finally {
                release.countDown();
                shutdown(runner);
            }
        } finally {
            release.countDown();
            shutdown(runner);
        }
    }

    @ParameterizedTest
    @CsvSource({"200,WRONG", "503,OK"})
    void wrongBodyAndNon200ResponsesAreActualFailures(int status, String body) throws Exception {
        AtomicInteger calls = new AtomicInteger();
        try (ServerApp server = ServerApp.start(config(), exchange -> {
            calls.incrementAndGet();
            Responses.text(exchange, status, body + "\n");
        })) {
            Result result = run(new String[]{origin(server.port()), "4", "2"}, Duration.ofSeconds(2), Duration.ofSeconds(8));
            assertEquals(1, result.exit());
            assertMetrics(result, 4, 2, 0, 4);
            assertEquals(4, calls.get());
        }
    }

    @Test
    void connectionRefusalIsReportedAsFailure() throws Exception {
        // A bound, unconnected client socket reserves the port without listening.
        try (Socket reservation = new Socket()) {
            reservation.bind(new InetSocketAddress("127.0.0.1", 0));
            Result result = run(new String[]{origin(reservation.getLocalPort()), "2", "1"},
                    Duration.ofMillis(500), Duration.ofSeconds(4));
            assertEquals(1, result.exit());
            assertMetrics(result, 2, 1, 0, 2);
        }
    }

    static Stream<Arguments> invalidArguments() {
        return Stream.of(new String[0], new String[]{"http://127.0.0.1", "1"},
                        new String[]{"file:///tmp", "1", "1"},
                        new String[]{"http://127.0.0.1/path", "1", "1"},
                        new String[]{"http://user@127.0.0.1", "1", "1"},
                        new String[]{"http://127.0.0.1?query=x", "1", "1"},
                        new String[]{"http://127.0.0.1#fragment", "1", "1"},
                        new String[]{"http://127.0.0.1:65536", "1", "1"},
                        new String[]{"http://127.0.0.1", "0", "1"},
                        new String[]{"http://127.0.0.1", "-1", "1"},
                        new String[]{"http://127.0.0.1", "abc", "1"},
                        new String[]{"http://127.0.0.1", "2", "0"},
                        new String[]{"http://127.0.0.1", "2", "3"},
                        new String[]{"http://127.0.0.1", "2", "abc"})
                .map(args -> Arguments.of((Object) args));
    }

    @ParameterizedTest
    @MethodSource("invalidArguments")
    void invalidArgumentsReturnExitTwoWithoutMeasurements(String[] args) {
        Result result = run(args, Duration.ofSeconds(1), Duration.ofSeconds(2));
        assertEquals(2, result.exit());
        assertEquals("", result.out());
        assertTrue(result.err().contains("Usage: LoadProbe"));
    }

    @Test
    void requestTimeoutReturnsFailureWhileHandlerIsStillHeld() throws Exception {
        assertTimeoutBehavior(Duration.ofMillis(300), Duration.ofSeconds(3), 1, 1, false);
    }

    @Test
    void overallDeadlineCancelsInFlightAndQueuedRequestsBeforeRequestTimeout() throws Exception {
        assertTimeoutBehavior(Duration.ofSeconds(5), Duration.ofMillis(700), 4, 2, true);
    }

    private static void assertTimeoutBehavior(Duration requestTimeout, Duration overallTimeout,
                                              int count, int concurrency, boolean overallExpected) throws Exception {
        CountDownLatch entered = new CountDownLatch(concurrency);
        CountDownLatch release = new CountDownLatch(1);
        ExecutorService runner = Executors.newSingleThreadExecutor();
        try (ServerApp server = ServerApp.start(config(), exchange -> {
            entered.countDown();
            try {
                if (!release.await(10, TimeUnit.SECONDS)) throw new IOException("Test release timed out");
                Responses.text(exchange, 200, "OK\n");
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                throw new IOException(interrupted);
            }
        })) {
            try {
                Future<Result> future = runner.submit(() -> run(new String[]{origin(server.port()),
                        Integer.toString(count), Integer.toString(concurrency)}, requestTimeout, overallTimeout));
                assertTrue(entered.await(3, TimeUnit.SECONDS), "Exercise a real held request rather than connection refusal");
                Result result = future.get(6, TimeUnit.SECONDS);
                assertEquals(1, result.exit());
                assertMetrics(result, count, concurrency, 0, count);
                assertEquals(1, release.getCount(), "Probe must return before the blocked handlers are released");
                if (overallExpected) assertTrue(result.err().contains("Overall probe deadline reached"));
                else assertEquals("", result.err());
            } finally {
                release.countDown();
                shutdown(runner);
            }
        } finally {
            release.countDown();
            shutdown(runner);
        }
    }
}
