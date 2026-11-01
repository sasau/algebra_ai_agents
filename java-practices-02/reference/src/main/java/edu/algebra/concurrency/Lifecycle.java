package edu.algebra.concurrency;

import java.util.concurrent.atomic.AtomicReference;

/** start creates concurrency; join waits and makes the worker's writes visible. */
public final class Lifecycle {
    private Lifecycle() {}

    public static String startAndJoin() throws InterruptedException {
        AtomicReference<String> result = new AtomicReference<>();
        Thread worker = Thread.ofPlatform().name("lesson-worker").unstarted(
                () -> result.set(Thread.currentThread().getName()));
        worker.start();
        worker.join(); // Completion is established before the caller reads the result.
        return result.get();
    }

    public static String directRun() {
        AtomicReference<String> result = new AtomicReference<>();
        Thread worker = Thread.ofPlatform().name("unused-worker").unstarted(
                () -> result.set(Thread.currentThread().getName()));
        worker.run(); // A normal method call stays on the caller's platform thread.
        return result.get();
    }
}
