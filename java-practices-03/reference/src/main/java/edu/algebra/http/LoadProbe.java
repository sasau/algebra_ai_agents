package edu.algebra.http;

import java.io.PrintStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/** Standalone correctness-aware probe; client concurrency is independent of server admission. */
public final class LoadProbe {
    private LoadProbe() { }

    public static void main(String[] args) {
        System.exit(run(args, System.out, System.err));
    }

    public static int run(String[] args, PrintStream out, PrintStream err) {
        return run(args, out, err, Duration.ofSeconds(3), Duration.ofSeconds(60));
    }

    /** Test seam for bounded timeout behavior without long real waits. */
    static int run(String[] args, PrintStream out, PrintStream err,
                   Duration requestTimeout, Duration overallTimeout) {
        final URI health;
        final int count;
        final int concurrency;
        try {
            if (args.length != 3 || requestTimeout.isNegative() || requestTimeout.isZero()
                    || overallTimeout.isNegative() || overallTimeout.isZero()) {
                throw new IllegalArgumentException();
            }
            URI origin = URI.create(args[0]);
            if (!("http".equalsIgnoreCase(origin.getScheme()) || "https".equalsIgnoreCase(origin.getScheme()))
                    || origin.getHost() == null || origin.getRawUserInfo() != null
                    || origin.getRawQuery() != null || origin.getRawFragment() != null
                    || !(origin.getRawPath().isEmpty() || "/".equals(origin.getRawPath()))
                    || origin.getPort() > 65535) {
                throw new IllegalArgumentException();
            }
            health = origin.resolve("/health");
            count = Integer.parseInt(args[1]);
            concurrency = Integer.parseInt(args[2]);
            if (count < 1 || concurrency < 1 || concurrency > count) {
                throw new IllegalArgumentException();
            }
        } catch (IllegalArgumentException e) {
            err.println("Usage: LoadProbe <http[s]://host[:port]> <positive count> <concurrency 1..count>");
            return 2;
        }

        HttpClient client = HttpClient.newBuilder().connectTimeout(requestTimeout).build();
        ExecutorService workers = Executors.newFixedThreadPool(concurrency);
        List<Future<Boolean>> requests = new ArrayList<>();
        int successes = 0;
        int failures = 0;
        boolean interrupted = false;
        long started = System.nanoTime();
        long finished;
        try {
            for (int i = 0; i < count; i++) {
                requests.add(workers.submit(() -> {
                    try {
                        HttpRequest request = HttpRequest.newBuilder(health)
                                .timeout(requestTimeout).GET().build();
                        HttpResponse<byte[]> response = client.send(request, HttpResponse.BodyHandlers.ofByteArray());
                        return response.statusCode() == 200
                                && Arrays.equals("OK\n".getBytes(StandardCharsets.UTF_8), response.body());
                    } catch (java.io.IOException e) {
                        return false;
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        return false;
                    }
                }));
            }
            for (Future<Boolean> request : requests) {
                long remaining = overallTimeout.toNanos() - (System.nanoTime() - started);
                if (remaining <= 0) {
                    throw new TimeoutException("Overall deadline reached");
                }
                try {
                    if (request.get(remaining, TimeUnit.NANOSECONDS)) {
                        successes++;
                    } else {
                        failures++;
                    }
                } catch (ExecutionException e) {
                    failures++;
                }
            }
        } catch (TimeoutException e) {
            err.println("Overall probe deadline reached; unfinished requests count as failures.");
            failures = count - successes;
        } catch (InterruptedException e) {
            interrupted = true;
            err.println("Probe interrupted; unfinished requests count as failures.");
            failures = count - successes;
        } finally {
            finished = System.nanoTime();
            for (Future<Boolean> request : requests) {
                request.cancel(true);
            }
            // HttpClient.close() may wait without a bound. Cancel and bound cleanup explicitly.
            client.shutdownNow();
            workers.shutdownNow();
            try {
                workers.awaitTermination(2, TimeUnit.SECONDS);
                client.awaitTermination(Duration.ofSeconds(2));
            } catch (InterruptedException e) {
                interrupted = true;
            }
            if (interrupted) {
                Thread.currentThread().interrupt();
            }
        }
        double elapsed = (finished - started) / 1_000_000_000.0;
        out.printf(Locale.ROOT,
                "requests=%d concurrency=%d successes=%d failures=%d elapsed_seconds=%.6f successful_requests_per_second=%.3f%n",
                count, concurrency, successes, failures, elapsed, successes / elapsed);
        return failures == 0 && !interrupted ? 0 : 1;
    }
}
