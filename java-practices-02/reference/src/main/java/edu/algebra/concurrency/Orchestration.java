package edu.algebra.concurrency;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

public final class Orchestration {
    private Orchestration() {}

    /** Simulated independent shop quotes; values are cents, not measured network responses. */
    public static int quoteTotal() throws Exception {
        List<Callable<Integer>> lookups = List.of(
                () -> { Thread.sleep(5); return 1200; },
                () -> { Thread.sleep(5); return 1800; },
                () -> { Thread.sleep(5); return 2400; });
        return collectQuotes(lookups, Duration.ofSeconds(2));
    }

    /**
     * Collect every quote under one batch deadline. Injected Callables let unit
     * tests exercise the application's actual failure and cancellation paths.
     * A thrown task exception reaches the caller through Future.get. Timeout
     * cancels unfinished work; the lesson tasks cooperate with interruption.
     */
    public static int collectQuotes(List<Callable<Integer>> lookups, Duration timeout) throws Exception {
        if (lookups.isEmpty() || timeout.isZero() || timeout.isNegative()) {
            throw new IllegalArgumentException("Provide quotes and a positive batch deadline");
        }
        try (var executor = Executors.newFixedThreadPool(2)) {
            var receipts = executor.invokeAll(lookups, timeout.toNanos(), TimeUnit.NANOSECONDS);
            int total = 0;
            for (var receipt : receipts) {
                if (receipt.isCancelled()) throw new TimeoutException("Quote batch deadline");
                total += receipt.get(); // A failed Callable reaches the caller as ExecutionException.
            }
            return total;
        }
    }

    /** Queue capacity is two. Taking A creates the capacity needed by put(C). */
    public static List<String> boundedQueue() throws Exception {
        var queue = new ArrayBlockingQueue<String>(2);
        queue.put("A");
        queue.put("B");
        var aboutToPut = new CountDownLatch(1);
        try (var executor = Executors.newSingleThreadExecutor()) {
            var producer = executor.submit(() -> {
                aboutToPut.countDown();
                queue.put("C"); // Blocks if the consumer has not yet removed A.
                return null;
            });
            try {
                if (!aboutToPut.await(2, TimeUnit.SECONDS)) throw new TimeoutException("Producer start");
                var result = new ArrayList<String>();
                result.add(queue.take());
                producer.get(2, TimeUnit.SECONDS);
                queue.drainTo(result);
                return List.copyOf(result);
            } finally {
                producer.cancel(true); // Do not leave a producer blocked if the caller is interrupted.
            }
        }
    }
}
