package edu.algebra.concurrency;

import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

public final class Races {
    private Races() {}
    private static final class VolatileCounter { volatile int value; }
    private static final class MonitorCounter {
        private int value;
        synchronized void increment() { value++; }
        synchronized int value() { return value; }
    }

    /** Force both reads before either write; volatile still does not make ++ atomic. */
    public static int forcedLostUpdate() throws Exception {
        var counter = new VolatileCounter();
        var bothRead = new CyclicBarrier(2);
        Callable<Void> increment = () -> {
            int snapshot = counter.value;
            bothRead.await(2, TimeUnit.SECONDS);
            counter.value = snapshot + 1;
            return null;
        };
        try (var executor = Executors.newFixedThreadPool(2)) {
            var futures = executor.invokeAll(List.of(increment, increment), 3, TimeUnit.SECONDS);
            for (var future : futures) future.get(); // Observe exceptions rather than losing them.
        }
        return counter.value;
    }

    public static int safeIncrements(boolean atomic, int perWorker) throws Exception {
        var atom = new AtomicInteger();
        var monitor = new MonitorCounter();
        Callable<Void> increment = () -> {
            for (int i = 0; i < perWorker; i++) {
                if (atomic) atom.incrementAndGet();
                else monitor.increment();
            }
            return null;
        };
        try (var executor = Executors.newFixedThreadPool(2)) {
            for (var future : executor.invokeAll(List.of(increment, increment), 3, TimeUnit.SECONDS)) {
                future.get();
            }
        }
        return atomic ? atom.get() : monitor.value();
    }
}
