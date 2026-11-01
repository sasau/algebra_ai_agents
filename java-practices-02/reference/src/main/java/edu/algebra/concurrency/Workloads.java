package edu.algebra.concurrency;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;

/** Controlled workloads: compare execution strategies without changing the task itself. */
public final class Workloads {
    private Workloads() {}
    public enum Mode { SEQUENTIAL, PLATFORM_POOL, PLATFORM_PER_TASK, VIRTUAL_PER_TASK }
    public enum Kind { BLOCKING, CPU }
    private record Value(long checksum, boolean virtual) {}
    public record Report(Mode mode, int completed, long checksum, int virtualTasks,
                         int peakActive, long elapsedNanos) {}

    public static Report run(Mode mode, Kind kind, int tasks, int waitMillis,
                             int cpuIterations, int parallelism, int resourceLimit) throws Exception {
        if (tasks < 1 || tasks > 256 || waitMillis < 0 || waitMillis > 100
                || (long) tasks * waitMillis > 10_000 || cpuIterations < 1
                || cpuIterations > 1_000_000 || parallelism < 1 || parallelism > 64
                || resourceLimit < 0 || resourceLimit > 256) {
            throw new IllegalArgumentException("Use bounded task, work, pool and resource limits");
        }
        var active = new AtomicInteger();
        var peak = new AtomicInteger();
        var permits = new Semaphore(resourceLimit == 0 ? tasks : resourceLimit);
        var jobs = new ArrayList<Callable<Value>>();
        for (int id = 1; id <= tasks; id++) {
            final int taskId = id;
            jobs.add(() -> {
                permits.acquire(); // Task count and scarce-resource capacity are separate choices.
                try {
                    peak.accumulateAndGet(active.incrementAndGet(), Math::max);
                    long checksum = taskId;
                    if (kind == Kind.BLOCKING) Thread.sleep(Duration.ofMillis(waitMillis));
                    else {
                        // Returned data prevents an unused CPU calculation from being discarded.
                        for (int i = 0; i < cpuIterations; i++) checksum = checksum * 31 + i;
                    }
                    return new Value(checksum, Thread.currentThread().isVirtual());
                } finally {
                    active.decrementAndGet();
                    permits.release();
                }
            });
        }
        long started = System.nanoTime(); // Includes executor creation, joining and cleanup.
        List<Value> values = new ArrayList<>();
        if (mode == Mode.SEQUENTIAL) {
            for (var job : jobs) values.add(job.call());
        } else {
            try (ExecutorService executor = switch (mode) {
                case PLATFORM_POOL -> Executors.newFixedThreadPool(parallelism);
                case PLATFORM_PER_TASK -> Executors.newThreadPerTaskExecutor(Thread.ofPlatform().factory());
                case VIRTUAL_PER_TASK -> Executors.newVirtualThreadPerTaskExecutor();
                default -> throw new AssertionError(mode);
            }) {
                for (var future : executor.invokeAll(jobs, 15, TimeUnit.SECONDS)) {
                    if (future.isCancelled()) throw new TimeoutException("Workload batch deadline");
                    values.add(future.get());
                }
            }
        }
        long elapsed = System.nanoTime() - started;
        long checksum = values.stream().mapToLong(Value::checksum).sum();
        int virtual = (int) values.stream().filter(Value::virtual).count();
        return new Report(mode, values.size(), checksum, virtual, peak.get(), elapsed);
    }
}
